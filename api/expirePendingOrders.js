const { admin, db, restaurarEstoquePedido } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).send('Método não permitido');
  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization || '';
    const userAgent = String(req.headers['user-agent'] || '').toLowerCase();
    const isVercelCron = userAgent.includes('vercel-cron') || req.headers['x-vercel-cron'];
    const hasSecret = auth === `Bearer ${process.env.CRON_SECRET}` || req.query?.secret === process.env.CRON_SECRET;
    if (!isVercelCron && !hasSecret) return res.status(401).send('Não autorizado');
  }

  try {
    const database = db();
    const agora = admin.firestore.Timestamp.now();
    const snap = await database.collection('pedidos')
      .where('status', '==', 'aguardando_pagamento')
      .where('expiresAt', '<=', agora)
      .limit(50)
      .get();

    let count = 0;
    for (const doc of snap.docs) {
      await doc.ref.update({ status: 'expirado', pagamentoStatus: 'expired' });
      await restaurarEstoquePedido(doc.id);
      count++;
    }

    return res.status(200).json({ ok: true, expirados: count });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Erro ao expirar pedidos.' });
  }
};
