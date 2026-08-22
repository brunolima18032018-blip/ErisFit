const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin;
  }

  admin.initializeApp();
  return admin;
}

function db() {
  return initAdmin().firestore();
}

function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  const origin = req.headers.origin || '';
  if (allowed !== '*' && origin && origin !== allowed) {
    res.status(403).json({ error: 'Origem não autorizada.' });
    return true;
  }
  res.setHeader('Access-Control-Allow-Origin', allowed === '*' ? '*' : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
}

function centsSafe(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function getEstoqueProduto(p) {
  const variacoes = Array.isArray(p?.variacoes) ? p.variacoes : [];
  if (variacoes.length) {
    return variacoes.reduce((soma, v) => soma + Math.max(0, Math.floor(Number(v.estoque || 0))), 0);
  }
  const estoque = Number(p?.estoque ?? 0);
  return Number.isFinite(estoque) ? Math.max(0, Math.floor(estoque)) : 0;
}

function getProdutoRef(database, produtoId) {
  if (!produtoId) throw new Error('Produto sem ID.');
  return database.collection('produtos').doc(String(produtoId));
}


async function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Error('Token de admin ausente.');
  return initAdmin().auth().verifyIdToken(token);
}

async function restaurarEstoquePedido(pedidoId) {
  const database = db();
  await database.runTransaction(async (transaction) => {
    const pedidoRef = database.collection('pedidos').doc(String(pedidoId));
    const pedidoDoc = await transaction.get(pedidoRef);
    if (!pedidoDoc.exists) return;
    const pedido = pedidoDoc.data();
    if (!pedido.estoqueReservado) return;
    if (!['aguardando_pagamento', 'pagamento_recusado', 'cancelado', 'expirado', 'erro_pagamento'].includes(pedido.status)) return;

    for (const item of pedido.itens || []) {
      const ref = getProdutoRef(database, item.produtoId);
      const prodDoc = await transaction.get(ref);
      if (!prodDoc.exists) continue;

      const produto = prodDoc.data();
      const quantidade = Number(item.quantidade || 0);
      const variacoes = Array.isArray(produto.variacoes) ? produto.variacoes : [];
      if (item.variacaoIndex !== null && item.variacaoIndex !== undefined && variacoes[item.variacaoIndex]) {
        const idx = Number(item.variacaoIndex);
        const novasVariacoes = variacoes.map((v, i) => i === idx
          ? { ...v, estoque: Math.max(0, Math.floor(Number(v.estoque || 0))) + quantidade }
          : v);
        transaction.update(ref, { variacoes: novasVariacoes, estoque: getEstoqueProduto({ variacoes: novasVariacoes }) });
      } else {
        const estoqueAtual = getEstoqueProduto(produto);
        transaction.update(ref, { estoque: estoqueAtual + quantidade });
      }
    }

    transaction.update(pedidoRef, {
      estoqueReservado: false,
      estoqueRestauradoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

module.exports = {
  admin: initAdmin(),
  db,
  setCors,
  centsSafe,
  getEstoqueProduto,
  getProdutoRef,
  restaurarEstoquePedido,
  requireAdmin,
};
