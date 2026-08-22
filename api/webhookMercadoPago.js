const { admin, db, setCors, restaurarEstoquePedido } = require('./_shared');

module.exports = async function handler(req, res) {
  if (setCors(req, res)) return;

  try {
    if (!process.env.MP_ACCESS_TOKEN) return res.status(500).send('MP_ACCESS_TOKEN não configurado');
    const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id || req.body?.id;
    if (!paymentId) return res.status(200).send('sem payment id');

    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpResp.json();
    const pedidoId = payment.external_reference || payment.metadata?.pedidoId || payment.metadata?.pedido_id;
    if (!pedidoId) return res.status(200).send('sem pedido');

    const database = db();
    const pedidoRef = database.collection('pedidos').doc(String(pedidoId));
    const status = payment.status;
    if (status === 'approved') {
      await pedidoRef.update({
        status: 'pago',
        pagamentoStatus: status,
        mercadoPagoPaymentId: String(paymentId),
        pagoEm: admin.firestore.FieldValue.serverTimestamp(),
        dadosPagamento: {
          status,
          status_detail: payment.status_detail || null,
          payment_method_id: payment.payment_method_id || null,
          payment_type_id: payment.payment_type_id || null,
          transaction_amount: payment.transaction_amount || null,
        },
      });
    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(status)) {
      await pedidoRef.update({ status: 'pagamento_recusado', pagamentoStatus: status, mercadoPagoPaymentId: String(paymentId) });
      await restaurarEstoquePedido(String(pedidoId));
    } else {
      await pedidoRef.update({ pagamentoStatus: status, mercadoPagoPaymentId: String(paymentId), atualizadoEm: admin.firestore.FieldValue.serverTimestamp() });
    }

    return res.status(200).send('ok');
  } catch (e) {
    console.error(e);
    return res.status(500).send('erro');
  }
};
