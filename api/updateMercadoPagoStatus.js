const { admin, db, setCors, restaurarEstoquePedido, requireAdmin } = require('./_shared');

async function buscarPagamentoPorPedido(pedidoId) {
  const token = process.env.MP_ACCESS_TOKEN;
  const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc`;
  const resp = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || 'Erro ao consultar pagamentos no Mercado Pago.');
  return Array.isArray(data.results) && data.results.length ? data.results[0] : null;
}

async function aplicarStatusPagamento(pedidoId, payment) {
  const database = db();
  const pedidoRef = database.collection('pedidos').doc(String(pedidoId));
  if (!payment) {
    await pedidoRef.update({ atualizadoEm: admin.firestore.FieldValue.serverTimestamp() });
    return { status: 'sem_pagamento', message: 'Nenhum pagamento encontrado para este pedido.' };
  }

  const status = payment.status;
  if (status === 'approved') {
    await pedidoRef.update({
      status: 'pago',
      pagamentoStatus: status,
      mercadoPagoPaymentId: String(payment.id),
      pagoEm: admin.firestore.FieldValue.serverTimestamp(),
      dadosPagamento: {
        status,
        status_detail: payment.status_detail || null,
        payment_method_id: payment.payment_method_id || null,
        payment_type_id: payment.payment_type_id || null,
        transaction_amount: payment.transaction_amount || null,
      },
    });
    return { status: 'pago', paymentId: String(payment.id) };
  }

  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(status)) {
    await pedidoRef.update({ status: 'pagamento_recusado', pagamentoStatus: status, mercadoPagoPaymentId: String(payment.id) });
    await restaurarEstoquePedido(String(pedidoId));
    return { status: 'pagamento_recusado', paymentId: String(payment.id) };
  }

  await pedidoRef.update({ pagamentoStatus: status, mercadoPagoPaymentId: String(payment.id), atualizadoEm: admin.firestore.FieldValue.serverTimestamp() });
  return { status, paymentId: String(payment.id) };
}

module.exports = async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado.' });

  try {
    await requireAdmin(req);
    const pedidoId = req.body?.pedidoId || req.query?.pedidoId;
    if (!pedidoId) return res.status(400).json({ error: 'Informe pedidoId.' });
    const payment = await buscarPagamentoPorPedido(String(pedidoId));
    const result = await aplicarStatusPagamento(String(pedidoId), payment);
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'Erro ao atualizar status.' });
  }
};
