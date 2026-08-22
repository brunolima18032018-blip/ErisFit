const { admin, db, setCors, centsSafe, getEstoqueProduto, getProdutoRef, restaurarEstoquePedido } = require('./_shared');

module.exports = async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no Vercel.' });

  try {
    const database = db();
    const payload = req.body || {};
    const itens = Array.isArray(payload.itens) ? payload.itens : [];
    if (!itens.length) return res.status(400).json({ error: 'Carrinho vazio.' });

    const pedidoRef = database.collection('pedidos').doc();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000));
    let itensConfirmados = [];
    let subtotalCalculado = 0;

    await database.runTransaction(async (transaction) => {
      itensConfirmados = [];
      subtotalCalculado = 0;

      for (const item of itens) {
        const produtoId = String(item.produtoId || '');
        const quantidade = Math.max(1, Math.floor(Number(item.quantidade || 1)));
        const ref = getProdutoRef(database, produtoId);
        const prodDoc = await transaction.get(ref);
        if (!prodDoc.exists) throw new Error(`Produto não encontrado: ${item.nome || produtoId}`);
        const produto = prodDoc.data();
        if (produto.ativo === false) throw new Error(`Produto indisponível: ${produto.nome}`);
        const variacoes = Array.isArray(produto.variacoes) ? produto.variacoes : [];
        const variacaoIndex = item.variacaoIndex !== null && item.variacaoIndex !== undefined ? Number(item.variacaoIndex) : null;
        let nomeItem = produto.nome || item.nome || 'Produto';
        let updateData;
        let estoqueAtual = getEstoqueProduto(produto);

        if (variacaoIndex !== null && variacoes.length) {
          if (!variacoes[variacaoIndex]) throw new Error(`Variação de ${produto.nome} não encontrada.`);
          const variacao = variacoes[variacaoIndex];
          estoqueAtual = Math.max(0, Math.floor(Number(variacao.estoque || 0)));
          const variacaoLabel = [variacao.tamanho, variacao.cor].filter(Boolean).join(' / ');
          if (variacaoLabel) nomeItem = `${nomeItem} (${variacaoLabel})`;
          if (quantidade > estoqueAtual) throw new Error(`Estoque insuficiente para ${nomeItem}. Disponível: ${estoqueAtual}.`);
          const novasVariacoes = variacoes.map((v, idx) => idx === variacaoIndex ? { ...v, estoque: estoqueAtual - quantidade } : v);
          updateData = { variacoes: novasVariacoes, estoque: getEstoqueProduto({ variacoes: novasVariacoes }) };
        } else {
          if (quantidade > estoqueAtual) throw new Error(`Estoque insuficiente para ${produto.nome}. Disponível: ${estoqueAtual}.`);
          updateData = { estoque: estoqueAtual - quantidade };
        }

        const preco = centsSafe(produto.preco);
        subtotalCalculado += preco * quantidade;
        transaction.update(ref, updateData);
        itensConfirmados.push({
          produtoId,
          nome: nomeItem,
          quantidade,
          preco,
          total: centsSafe(preco * quantidade),
          variacaoIndex,
          variacaoLabel: item.variacaoLabel || '',
        });
      }

      const entrega = centsSafe(payload.entrega || 0);
      const desconto = centsSafe(payload.desconto || 0);
      const total = centsSafe(subtotalCalculado + entrega - desconto);
      if (total <= 0) throw new Error('Total inválido para pagamento.');

      transaction.set(pedidoRef, {
        origem: 'site',
        status: 'aguardando_pagamento',
        pagamentoStatus: 'pending',
        estoqueReservado: true,
        itens: itensConfirmados,
        cliente: payload.cliente || {},
        entregaDados: payload.entregaDados || null,
        tipoEntrega: payload.tipoEntrega || 'delivery',
        pagamentoMetodo: 'mercado_pago',
        subtotal: centsSafe(subtotalCalculado),
        desconto,
        entrega,
        total,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
      });
    });

    const pedidoDoc = await pedidoRef.get();
    const pedido = pedidoDoc.data();
    const backUrl = process.env.MP_BACK_URL || '';
    const webhookUrl = process.env.MP_WEBHOOK_URL || '';
    const preferenceBody = {
      external_reference: pedidoRef.id,
      items: pedido.itens.map((item) => ({
        id: item.produtoId,
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco,
        currency_id: 'BRL',
      })),
      shipments: pedido.entrega > 0 ? { cost: pedido.entrega, mode: 'not_specified' } : undefined,
      notification_url: webhookUrl || undefined,
      back_urls: backUrl
        ? {
            success: `${backUrl}?pedido=${pedidoRef.id}&status=success`,
            failure: `${backUrl}?pedido=${pedidoRef.id}&status=failure`,
            pending: `${backUrl}?pedido=${pedidoRef.id}&status=pending`,
          }
        : undefined,
      auto_return: backUrl ? 'approved' : undefined,
      metadata: { pedidoId: pedidoRef.id },
    };

    const mpResp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    });
    const mpData = await mpResp.json();
    if (!mpResp.ok) {
      await restaurarEstoquePedido(pedidoRef.id);
      await pedidoRef.update({ status: 'erro_pagamento', erroMercadoPago: mpData });
      return res.status(400).json({ error: 'Erro ao criar pagamento no Mercado Pago.', detalhe: mpData });
    }

    await pedidoRef.update({
      mercadoPagoPreferenceId: mpData.id,
      mercadoPagoInitPoint: mpData.init_point,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ pedidoId: pedidoRef.id, init_point: mpData.init_point, sandbox_init_point: mpData.sandbox_init_point });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'Erro ao criar pagamento.' });
  }
};
