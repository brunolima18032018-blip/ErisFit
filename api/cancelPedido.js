const { admin, db, setCors, restaurarEstoquePedido, requireAdmin } = require('./_shared');

module.exports = async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    await requireAdmin(req);
    const pedidoId = req.body?.pedidoId || req.query?.pedidoId;
    if (!pedidoId) return res.status(400).json({ error: 'Informe pedidoId.' });
    const database = db();
    const ref = database.collection('pedidos').doc(String(pedidoId));
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Pedido não encontrado.' });
    const pedido = doc.data();
    if (pedido.status === 'pago') {
      return res.status(400).json({ error: 'Pedido pago não deve ser cancelado por aqui. Faça estorno/ajuste manual no Mercado Pago primeiro.' });
    }
    await ref.update({
      status: 'cancelado',
      canceladoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
    await restaurarEstoquePedido(String(pedidoId));
    return res.status(200).json({ ok: true, status: 'cancelado' });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'Erro ao cancelar pedido.' });
  }
};
