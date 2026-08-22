// ─── FIREBASE CONFIG + DADOS INICIAIS ─────────────────────────────────────────
// Credenciais do Firebase deste projeto. Se o Firebase ainda não estiver
// disponível (ex.: prévia local sem internet), a loja usa os produtos abaixo.
const firebaseConfig = {
  apiKey: "AIzaSyCGs24Zjzfr9a1SqrZHo3tG-JRHTegSKAs",
  authDomain: "erisfit.firebaseapp.com",
  projectId: "erisfit",
  storageBucket: "erisfit.firebasestorage.app",
  messagingSenderId: "319946026105",
  appId: "1:319946026105:web:5500671991fa2415a738a8"
};

const PRODUTOS_PADRAO = [
  { id: 1, nome: "Regata Crepe Golinha", categoria: "blusas", preco: 59.90, imagem: "./assets/blusa-feminia1.jpeg", descricao: "Regata feminina em crepe com gola alta franzida. Modelagem soltinha e versátil.", estoque: 10, ativo: true, destaque: true },
  { id: 2, nome: "Camisa Manga Longa de Renda", categoria: "blusas", preco: 99.90, imagem: "./assets/blusa-feminina2.jpeg", descricao: "Camisa feminina de manga longa com detalhes em renda. Elegante para o dia a dia.", estoque: 10, ativo: true, destaque: false },
  { id: 3, nome: "Calça Jogger em Lyocell", categoria: "calças", preco: 159.90, imagem: "./assets/calça-feminina.jpeg", descricao: "Calça jogger bege com cintura elástica e amarração. Tecido leve e confortável.", estoque: 10, ativo: true, destaque: false },
  { id: 4, nome: "Conjunto Pantalona com Cropped", categoria: "conjuntos", preco: 139.90, imagem: "./assets/Calça-Feminina-Pantalona.png", descricao: "Conjunto feminino com calça pantalona coral e cropped estampado. Ideal para o verão.", estoque: 10, ativo: true, destaque: true },
  { id: 5, nome: "Shorts de Viscolinho com Amarração", categoria: "shorts", preco: 39.90, imagem: "./assets/short-feminino.webp", descricao: "Shorts feminino vermelho de cintura alta com amarração e bolsos. Conforto e estilo.", estoque: 10, ativo: true, destaque: false },
  { id: 6, nome: "Short Jeans Cintura Alta", categoria: "shorts", preco: 79.90, imagem: "./assets/Short Jeans.jpeg", descricao: "Short jeans cintura alta com detalhes destroyed e cinto combinando.", estoque: 10, ativo: true, destaque: false },
  { id: 7, nome: "Kit Coração Vermelho", categoria: "acessórios", preco: 49.90, imagem: "./assets/Conjunto.jpeg", descricao: "Conjunto folheado com colar, brincos e anel de pedra coração vermelho com zircônias.", estoque: 10, ativo: true, destaque: true },
  { id: 8, nome: "Tênis Casual Branco", categoria: "calçados", preco: 149.90, imagem: "./assets/Tênis.webp", descricao: "Tênis feminino branco com solado bege. Confortável para caminhadas e o dia a dia.", estoque: 10, ativo: true, destaque: false },
  { id: 9, nome: "Top Cropped Estampado", categoria: "tops", preco: 49.90, imagem: "./assets/Calça-Feminina-Pantalona.png", descricao: "Cropped feminino de alcinha com estampa floral. Perfeito para looks de verão e treinos leves.", estoque: 10, ativo: true, destaque: false },
];

const CUPONS_PADRAO = [
  { codigo: "ERISFIT10", tipo: "percentual", valor: 10, valorMinimo: 0, validade: null, ativo: true },
];

let db = null;
if (window.firebase) {
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  } catch (e) {
    console.warn("Firebase indisponível. Usando dados locais da loja.", e);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    // --- SELETORES GLOBAIS ---
    const cartIcon = document.querySelector(".cart-icon"),
        cartSidebar = document.querySelector(".cart-sidebar"),
        cartOverlay = document.querySelector(".cart-overlay"),
        closeCartBtn = document.querySelector(".close-cart-btn"),
        cartBody = document.querySelector(".cart-body"),
        cartBadge = document.querySelector(".cart-badge");
    const deliveryToggleBtns = document.querySelectorAll(".delivery-btn");
    const deliveryForm = document.getElementById("delivery-form-container"),
        pickupForm = document.getElementById("pickup-form-container");
    const deliveryPhoneInput = document.getElementById("delivery-phone"),
        pickupPhoneInput = document.getElementById("pickup-phone"),
        deliveryCepInput = document.getElementById("delivery-cep"),
        deliveryAddressInput = document.getElementById("delivery-address"),
        deliveryFeeNotice = document.querySelector(".delivery-fee-notice");
    const trocoContainer = document.getElementById("troco-container");
    const couponInput = document.getElementById("coupon-input"),
        applyCouponBtn = document.getElementById("apply-coupon-btn"),
        couponFeedback = document.getElementById("coupon-feedback");
    const subtotalElem = document.getElementById("cart-subtotal"),
        cartDiscountElem = document.getElementById("cart-discount"),
        discountLineElem = document.querySelector(".discount-line"),
        deliveryFeeElem = document.getElementById("cart-delivery-fee"),
        deliveryFeeLineElem = document.querySelector(".delivery-fee-line"),
        totalElem = document.getElementById("cart-total");
    const finishOrderBtn = document.getElementById("finish-order-btn");
    const mercadoPagoBtn = document.getElementById("mercado-pago-btn");
    // Seletores da barra inferior
    const viewCartBanner = document.querySelector(".view-cart-banner");
    const bannerTotalElem = document.getElementById("banner-total");
    const viewCartBannerBtn = document.querySelector(".view-cart-banner-btn");

    // Seletores para o sistema de filtro
    const categoryBtns = document.querySelectorAll(".category-btn");
    const searchInput = document.querySelector(".search-input");

    // --- CARREGAR PRODUTOS DO FIREBASE (com fallback local) ---
    let produtos = [];
    if (db) {
        try {
            const snap = await db.collection("produtos")
                .where("ativo", "!=", false)
                .get();
            produtos = snap.docs.map((d) => {
                const data = d.data();
                return { docId: d.id, ...data, estoque: Number(data.estoque ?? 0) };
            });
        } catch (e) {
            console.error("Erro ao carregar produtos do Firebase:", e);
        }
    }
    if (produtos.length === 0) produtos = [...PRODUTOS_PADRAO];

    // --- CARREGAR CUPONS DO FIREBASE (com fallback local) ---
    let coupons = [...CUPONS_PADRAO];
    if (db) {
        try {
            const cuponsSnap = await db.collection("cupons").get();
            const cuponsFirebase = cuponsSnap.docs.map((d) => ({ docId: d.id, ...d.data() }));
            if (cuponsFirebase.length > 0) coupons = cuponsFirebase;
        } catch (e) {
            console.error("Erro ao carregar cupons do Firebase:", e);
        }
    }

    // --- CARREGAR CONFIGURAÇÕES DA LOJA DO FIREBASE ---
    const CONFIG_PADRAO = {
        nomeLoja: "Erisfit",
        whatsapp: "5585989498084",
        cepLoja: "60353165",
        enderecoLoja: "Avenida Independência, 2621 - Quintino Cunha, Fortaleza - CE",
        latitudeLoja: -3.7246723,
        longitudeLoja: -38.5993260,
        taxaFretePorKm: 1,
        functionsBaseUrl: "", // Vercel usa /api; Firebase Hosting pode usar rewrite ou URL da function.
        retiradaDias: [1, 2, 3, 4, 5, 6],
        retiradaHoraInicio: "08:00",
        retiradaHoraFim: "18:00",
        retiradaIntervalo: 60,
        bannerUrl: "",
        corPrimaria: "#A855F7",
        corSecundaria: "#0F0F14",
        corDestaque: "#C084FC",
    };
    let configLoja = { ...CONFIG_PADRAO };
    if (db) {
        try {
            const configDoc = await db.collection("configuracoes").doc("geral").get();
            if (configDoc.exists) configLoja = { ...CONFIG_PADRAO, ...configDoc.data() };
        } catch (e) {
            console.error("Erro ao carregar configurações da loja:", e);
        }
    }

    const aplicarConfiguracoesDaLoja = () => {
        document.title = configLoja.nomeLoja;

        const heroEl = document.querySelector(".hero-section");
        if (heroEl && configLoja.bannerUrl) {
            heroEl.style.backgroundImage = `linear-gradient(135deg, rgba(15,15,20,.78), rgba(76,29,149,.62)), url("${configLoja.bannerUrl}")`;
            heroEl.style.backgroundSize = "cover";
            heroEl.style.backgroundPosition = "center";
            heroEl.classList.add("hero--custom-banner");
        }

        const root = document.documentElement;
        if (configLoja.corPrimaria) root.style.setProperty("--primary-color", configLoja.corPrimaria);
        if (configLoja.corSecundaria) root.style.setProperty("--secondary-color", configLoja.corSecundaria);
        if (configLoja.corDestaque) root.style.setProperty("--accent-color", configLoja.corDestaque);

        const logoTitleEl = document.querySelector(".logo h1, .logo-name");
        if (logoTitleEl) logoTitleEl.textContent = configLoja.nomeLoja || "ErisFit";

        const footerEl = document.querySelector(".footer-copy");
        if (footerEl) {
            const ano = new Date().getFullYear();
            footerEl.textContent = `${ano} - ${configLoja.nomeLoja}. Todos os direitos reservados`;
        }

        const pickupDateInput = document.getElementById("pickup-date");
        if (pickupDateInput) {
            const hoje = new Date();
            pickupDateInput.min = hoje.toISOString().split("T")[0];
        }

        const pickupTimeSelect = document.getElementById("pickup-time");
        if (pickupTimeSelect) {
            const [hIni, mIni] = configLoja.retiradaHoraInicio.split(":").map(Number);
            const [hFim, mFim] = configLoja.retiradaHoraFim.split(":").map(Number);
            const inicioMin = hIni * 60 + mIni;
            const fimMin = hFim * 60 + mFim;
            const passo = configLoja.retiradaIntervalo || 60;
            let opcoes = `<option value="" disabled selected>Selecione</option>`;
            for (let m = inicioMin; m <= fimMin; m += passo) {
                const h = String(Math.floor(m / 60)).padStart(2, "0");
                const min = String(m % 60).padStart(2, "0");
                opcoes += `<option value="${h}:${min}">${h}:${min}</option>`;
            }
            pickupTimeSelect.innerHTML = opcoes;
        }
    };
    aplicarConfiguracoesDaLoja();

    // --- ESTADO DA APLICAÇÃO ---
    let carrinho = [],
        tipoEntrega = "delivery",
        appliedCoupon = null;

    try {
        const salvo = JSON.parse(localStorage.getItem("erisfit_carrinho") || "[]");
        if (Array.isArray(salvo)) {
            carrinho = salvo.map((item) => {
                const produtoAtual = produtos.find((p) => String(p.id) === String(item.id) || String(p.docId) === String(item.docId));
                return produtoAtual ? { ...produtoAtual, cartKey: item.cartKey || `${produtoAtual.id}${item.variacaoIndex !== null && item.variacaoIndex !== undefined && item.variacaoIndex !== "" ? `::${item.variacaoIndex}` : ""}`, variacaoIndex: item.variacaoIndex ?? null, variacaoLabel: item.variacaoLabel || "", quantidade: Math.max(1, Math.floor(Number(item.quantidade || 1))) } : null;
            }).filter(Boolean);
        }
    } catch (_) {}

    let taxaEntrega = 0;
    let distanciaEntregaKm = null;
    let kmCobradosEntrega = 0;
    let freteCalculado = false;
    let cepDestinoInfo = null;
    let freteTimer = null;

    // Variáveis de estado para filtros
    let categoriaAtiva = "all";
    let termoBusca = "";

    const formatarMoeda = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // --- ESTOQUE ---
    const getVariacoesProduto = (produto) => Array.isArray(produto?.variacoes) ? produto.variacoes : [];
    const getVariacaoLabel = (variacao) => {
        if (!variacao) return "";
        const partes = [variacao.tamanho, variacao.cor].filter(Boolean);
        return partes.length ? partes.join(" / ") : "Variação";
    };
    const getEstoqueProduto = (produto) => {
        const variacoes = getVariacoesProduto(produto);
        if (variacoes.length) {
            return variacoes.reduce((soma, v) => soma + Math.max(0, Math.floor(Number(v.estoque || 0))), 0);
        }
        const estoque = Number(produto?.estoque ?? 0);
        return Number.isFinite(estoque) ? Math.max(0, Math.floor(estoque)) : 0;
    };
    const getProdutoDocId = (produto) => String(produto?.docId || produto?.id);
    const getCartKey = (produtoId, variacaoIndex = null) => `${produtoId}${variacaoIndex !== null && variacaoIndex !== undefined && variacaoIndex !== "" ? `::${variacaoIndex}` : ""}`;
    const getEstoqueItem = (item) => {
        const produtoAtual = produtos.find((p) => String(p.id) === String(item.id) || String(p.docId) === String(item.docId)) || item;
        const variacoes = getVariacoesProduto(produtoAtual);
        if (item.variacaoIndex !== null && item.variacaoIndex !== undefined && variacoes[item.variacaoIndex]) {
            return Math.max(0, Math.floor(Number(variacoes[item.variacaoIndex].estoque || 0)));
        }
        return getEstoqueProduto(produtoAtual);
    };
    const getItemNomeCompleto = (item) => item.variacaoLabel ? `${item.nome} (${item.variacaoLabel})` : item.nome;
    const atualizarEstoqueLocal = (produtoId, novoEstoque, variacaoIndex = null, novasVariacoes = null) => {
        produtos = produtos.map((p) => {
            if (String(p.id) !== String(produtoId) && String(p.docId) !== String(produtoId)) return p;
            if (Array.isArray(novasVariacoes)) {
                return { ...p, variacoes: novasVariacoes, estoque: novasVariacoes.reduce((soma, v) => soma + Math.max(0, Math.floor(Number(v.estoque || 0))), 0) };
            }
            if (variacaoIndex !== null && getVariacoesProduto(p).length) {
                const variacoes = getVariacoesProduto(p).map((v, idx) => idx === Number(variacaoIndex) ? { ...v, estoque: Math.max(0, Math.floor(Number(novoEstoque) || 0)) } : v);
                return { ...p, variacoes, estoque: variacoes.reduce((soma, v) => soma + Math.max(0, Math.floor(Number(v.estoque || 0))), 0) };
            }
            return { ...p, estoque: Math.max(0, Math.floor(Number(novoEstoque) || 0)) };
        });
    };
    const verificarEstoqueCarrinho = () => {
        for (const item of carrinho) {
            const estoqueAtual = getEstoqueItem(item);
            if (estoqueAtual <= 0) return { ok: false, mensagem: `O produto "${getItemNomeCompleto(item)}" está sem estoque.` };
            if (item.quantidade > estoqueAtual) return { ok: false, mensagem: `Só temos ${estoqueAtual} unidade(s) de "${getItemNomeCompleto(item)}" em estoque.` };
        }
        return { ok: true };
    };
    const baixarEstoqueDoPedido = async () => {
        const estoqueOk = verificarEstoqueCarrinho();
        if (!estoqueOk.ok) throw new Error(estoqueOk.mensagem);

        if (!db) {
            carrinho.forEach((item) => atualizarEstoqueLocal(item.id, getEstoqueItem(item) - item.quantidade, item.variacaoIndex));
            filtrarEMostrarProdutos();
            atualizarCarrinho();
            return;
        }

        const baixas = [];
        await db.runTransaction(async (transaction) => {
            for (const item of carrinho) {
                const produtoAtual = produtos.find((p) => String(p.id) === String(item.id) || String(p.docId) === String(item.docId)) || item;
                const ref = db.collection("produtos").doc(getProdutoDocId(produtoAtual));
                const doc = await transaction.get(ref);
                if (!doc.exists) throw new Error(`Produto "${item.nome}" não encontrado no estoque.`);
                const dados = doc.data();
                const variacoes = getVariacoesProduto(dados);
                if (item.variacaoIndex !== null && item.variacaoIndex !== undefined && variacoes.length) {
                    const idx = Number(item.variacaoIndex);
                    if (!variacoes[idx]) throw new Error(`Variação de "${item.nome}" não encontrada.`);
                    const estoqueAtual = Math.max(0, Math.floor(Number(variacoes[idx].estoque || 0)));
                    if (item.quantidade > estoqueAtual) throw new Error(`Só temos ${estoqueAtual} unidade(s) de "${getItemNomeCompleto(item)}" em estoque.`);
                    const novasVariacoes = variacoes.map((v, i) => i === idx ? { ...v, estoque: estoqueAtual - item.quantidade } : v);
                    const novoEstoque = novasVariacoes.reduce((soma, v) => soma + Math.max(0, Math.floor(Number(v.estoque || 0))), 0);
                    transaction.update(ref, { variacoes: novasVariacoes, estoque: novoEstoque });
                    baixas.push({ id: item.id, docId: getProdutoDocId(produtoAtual), variacaoIndex: idx, variacoes: novasVariacoes, estoque: novoEstoque });
                } else {
                    const estoqueAtual = getEstoqueProduto(dados);
                    if (estoqueAtual <= 0) throw new Error(`O produto "${item.nome}" está sem estoque.`);
                    if (item.quantidade > estoqueAtual) throw new Error(`Só temos ${estoqueAtual} unidade(s) de "${item.nome}" em estoque.`);
                    const novoEstoque = estoqueAtual - item.quantidade;
                    transaction.update(ref, { estoque: novoEstoque });
                    baixas.push({ id: item.id, docId: getProdutoDocId(produtoAtual), estoque: novoEstoque });
                }
            }
        });

        baixas.forEach((b) => atualizarEstoqueLocal(b.docId || b.id, b.estoque, b.variacaoIndex, b.variacoes));
        filtrarEMostrarProdutos();
        atualizarCarrinho();
    };

    // --- CÁLCULO DE FRETE POR CEP ---
    const limparCep = (cep) => String(cep || "").replace(/\D/g, "").slice(0, 8);
    const normalizarTexto = (txt) =>
        String(txt || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
    const aplicarMascaraCep = (cep) => {
        const limpo = limparCep(cep);
        return limpo.length > 5 ? `${limpo.slice(0, 5)}-${limpo.slice(5)}` : limpo;
    };

    const limparTelefone = (telefone) => String(telefone || "").replace(/\D/g, "").slice(0, 11);
    const aplicarMascaraTelefone = (telefone) => {
        const n = limparTelefone(telefone);
        if (n.length <= 2) return n ? `(${n}` : "";
        if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
        if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
        return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
    };
    const telefoneValido = (telefone) => {
        const n = limparTelefone(telefone);
        return n.length === 10 || n.length === 11;
    };

    const setAvisoFrete = (mensagem, tipo = "") => {
        if (!deliveryFeeNotice) return;
        deliveryFeeNotice.textContent = mensagem;
        deliveryFeeNotice.classList.remove("success", "error", "loading");
        if (tipo) deliveryFeeNotice.classList.add(tipo);
    };

    const COORDENADAS_LOJA_PADRAO = { lat: -3.7246723, lon: -38.5993260 };

    const getCoordenadasLoja = () => ({
        lat: Number(configLoja.latitudeLoja) || COORDENADAS_LOJA_PADRAO.lat,
        lon: Number(configLoja.longitudeLoja) || COORDENADAS_LOJA_PADRAO.lon,
    });

    const extrairNumeroEndereco = (texto) => {
        const match = String(texto || "").match(/(?:n[ºo]?\s*:?\s*)?(\d{1,6})/i);
        return match ? match[1] : "";
    };

    const buscarEnderecoPorCep = async (cep) => {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!resposta.ok) throw new Error("Não foi possível consultar o CEP.");
        const dados = await resposta.json();
        if (dados.erro) throw new Error("CEP não encontrado.");
        return dados;
    };

    const buscarCoordenadas = async (consulta, cacheKey) => {
        const chaveCache = `erisfit_geo_${cacheKey}`;
        try {
            const cache = JSON.parse(localStorage.getItem(chaveCache) || "null");
            if (cache?.lat && cache?.lon) return cache;
        } catch (_) {}

        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(consulta)}`;
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("Não foi possível localizar o endereço no mapa.");
        const dados = await resposta.json();
        if (!dados.length) throw new Error("Endereço não localizado no mapa.");

        const coords = { lat: Number(dados[0].lat), lon: Number(dados[0].lon) };
        try { localStorage.setItem(chaveCache, JSON.stringify(coords)); } catch (_) {}
        return coords;
    };

    const montarConsultaDestino = (cep, enderecoViaCep) => {
        const enderecoDigitado = deliveryAddressInput?.value?.trim() || "";
        const numero = extrairNumeroEndereco(enderecoDigitado);
        const partes = [
            enderecoViaCep.logradouro,
            numero,
            enderecoViaCep.bairro,
            enderecoViaCep.localidade,
            enderecoViaCep.uf,
            aplicarMascaraCep(cep),
            "Brasil",
        ].filter(Boolean);
        return partes.join(", ");
    };

    const calcularDistanciaRetaKm = (origem, destino) => {
        const R = 6371;
        const toRad = (graus) => graus * Math.PI / 180;
        const dLat = toRad(destino.lat - origem.lat);
        const dLon = toRad(destino.lon - origem.lon);
        const lat1 = toRad(origem.lat);
        const lat2 = toRad(destino.lat);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const calcularDistanciaRotaKm = async (origem, destino) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${origem.lon},${origem.lat};${destino.lon},${destino.lat}?overview=false`;
            const resposta = await fetch(url);
            const dados = await resposta.json();
            const metros = dados?.routes?.[0]?.distance;
            if (resposta.ok && metros && Number.isFinite(metros)) return metros / 1000;
        } catch (_) {}
        // Se a rota por ruas falhar, usa distância em linha reta com margem de 30%.
        return calcularDistanciaRetaKm(origem, destino) * 1.3;
    };

    const calcularValorFretePorKm = (distanciaKm) => {
        const taxaPorKm = Number(configLoja.taxaFretePorKm || 1);
        const kmCobrados = Math.max(1, Math.ceil(distanciaKm));
        return { valor: kmCobrados * taxaPorKm, kmCobrados };
    };

    const calcularFretePorCep = async (cepDigitado, opcoes = {}) => {
        const cep = limparCep(cepDigitado);
        if (cep.length < 8) {
            taxaEntrega = 0;
            distanciaEntregaKm = null;
            kmCobradosEntrega = 0;
            freteCalculado = false;
            cepDestinoInfo = null;
            setAvisoFrete(
                `Digite o CEP para calcular a entrega. Frete: R$ 1,00 por km, arredondando para cima. Saída: ${configLoja.enderecoLoja || "Av. Independência, 2621 - Quintino Cunha"}.`,
            );
            atualizarCarrinho();
            return false;
        }

        if (!opcoes.silencioso) setAvisoFrete("Calculando frete por distância...", "loading");
        try {
            const endereco = await buscarEnderecoPorCep(cep);
            const origem = getCoordenadasLoja();
            const consultaDestino = montarConsultaDestino(cep, endereco);
            const destino = await buscarCoordenadas(consultaDestino, `${cep}_${extrairNumeroEndereco(deliveryAddressInput?.value || "") || "sem_numero"}`);
            const distanciaKm = await calcularDistanciaRotaKm(origem, destino);
            const frete = calcularValorFretePorKm(distanciaKm);

            taxaEntrega = frete.valor;
            distanciaEntregaKm = distanciaKm;
            kmCobradosEntrega = frete.kmCobrados;
            freteCalculado = true;
            cepDestinoInfo = { ...endereco, distanciaKm, kmCobrados: frete.kmCobrados };

            if (deliveryAddressInput && !deliveryAddressInput.value.trim()) {
                const enderecoPreenchido = [
                    endereco.logradouro,
                    endereco.bairro,
                    `${endereco.localidade || ""}/${endereco.uf || ""}`
                ].filter(Boolean).join(" - ");
                deliveryAddressInput.value = enderecoPreenchido ? `${enderecoPreenchido}. Nº: ` : "";
            }

            setAvisoFrete(
                `Frete: ${formatarMoeda(taxaEntrega)} — distância aprox. ${distanciaKm.toFixed(1).replace(".", ",")} km, cobrando ${frete.kmCobrados} km x R$ ${(Number(configLoja.taxaFretePorKm || 1)).toFixed(2).replace(".", ",")}.`,
                "success"
            );
            atualizarCarrinho();
            return true;
        } catch (e) {
            taxaEntrega = 0;
            distanciaEntregaKm = null;
            kmCobradosEntrega = 0;
            freteCalculado = false;
            cepDestinoInfo = null;
            setAvisoFrete(
                `Não consegui calcular o frete por km para este CEP. Confira o CEP/endereço e tente novamente. Detalhe: ${e.message}`,
                "error"
            );
            atualizarCarrinho();
            return false;
        }
    };

    const getScrollbarWidth = () =>
        window.innerWidth - document.documentElement.clientWidth;
    const lockScroll = () => {
        document.body.style.paddingRight = `${getScrollbarWidth()}px`;
        document.body.classList.add("no-scroll");
    };
    const unlockScroll = () => {
        document.body.style.paddingRight = "";
        document.body.classList.remove("no-scroll");
    };
    const abrirCarrinho = () => {
        cartSidebar.classList.add("show");
        cartOverlay.classList.add("show");
        lockScroll();
    };
    const fecharCarrinho = () => {
        cartSidebar.classList.remove("show");
        cartOverlay.classList.remove("show");
        unlockScroll();
    };

    const animacaoVoarParaCarrinho = (productCard) => {
        const productImg = productCard.querySelector(".product-img"),
            imgRect = productImg.getBoundingClientRect(),
            cartRect = cartIcon.getBoundingClientRect(),
            flyingImg = document.createElement("img");
        flyingImg.src = productImg.src;
        flyingImg.classList.add("product-image-fly");
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        document.body.appendChild(flyingImg);
        requestAnimationFrame(() => {
            flyingImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
            flyingImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
            flyingImg.style.width = "0px";
            flyingImg.style.height = "0px";
            flyingImg.style.opacity = "0";
        });
        flyingImg.addEventListener("transitionend", () => flyingImg.remove());
    };

    const renderMiniCard = (p) => `
        <div class="mini-product-card" data-id="${p.id}">
            <img src="${p.imagem}" alt="${p.nome}">
            <div class="mini-product-info">
                <h4>${p.nome}</h4>
                <p>${formatarMoeda(p.preco)}</p>
                <button class="mini-buy-btn" data-id="${p.id}">Comprar</button>
            </div>
        </div>`;

    const renderHomeHighlights = () => {
        const el = document.querySelector(".home-highlights");
        if (!el) return;
        if (categoriaAtiva !== "all" || termoBusca.trim()) { el.innerHTML = ""; return; }
        const ativos = produtos.filter((p) => p.ativo !== false && getEstoqueProduto(p) > 0);
        const destaques = ativos.filter((p) => p.destaque).slice(0, 4);
        const novidades = [...ativos].sort((a,b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 4);
        const ultimas = ativos.filter((p) => getEstoqueProduto(p) <= 3).slice(0, 4);
        const secoes = [];
        if (destaques.length) secoes.push(`<div class="highlight-section"><h3 class="highlight-title"><i class="fa-solid fa-star"></i> Destaques</h3><div class="highlight-row">${destaques.map(renderMiniCard).join("")}</div></div>`);
        if (novidades.length) secoes.push(`<div class="highlight-section"><h3 class="highlight-title"><i class="fa-solid fa-bolt"></i> Novidades</h3><div class="highlight-row">${novidades.map(renderMiniCard).join("")}</div></div>`);
        if (ultimas.length) secoes.push(`<div class="highlight-section"><h3 class="highlight-title"><i class="fa-solid fa-fire"></i> Últimas unidades</h3><div class="highlight-row">${ultimas.map(renderMiniCard).join("")}</div></div>`);
        el.innerHTML = secoes.join("");
    };

    // Função para filtrar e mostrar produtos
    const filtrarEMostrarProdutos = () => {
        let produtosFiltrados = produtos;

        // Filtro por categoria
        if (categoriaAtiva !== "all") {
            produtosFiltrados = produtosFiltrados.filter(
                (produto) => produto.categoria === categoriaAtiva,
            );
        }

        // Filtro por busca
        if (termoBusca.trim() !== "") {
            const termo = termoBusca.toLowerCase();
            produtosFiltrados = produtosFiltrados.filter(
                (produto) =>
                    produto.nome.toLowerCase().includes(termo) ||
                    (produto.descricao || "").toLowerCase().includes(termo),
            );
        }

        renderHomeHighlights();

        // Renderizar produtos filtrados
        const container = document.querySelector(".products-container");
        if (produtosFiltrados.length === 0) {
            container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
                            <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p style="font-size: 1.2rem; font-weight: 600;">Nenhum produto encontrado</p>
                        </div>
                    `;
        } else {
            container.innerHTML = produtosFiltrados
                .map((p) => {
                    const estoque = getEstoqueProduto(p);
                    const variacoes = getVariacoesProduto(p);
                    const disponivel = estoque > 0;
                    const variacaoSelect = variacoes.length ? `
                        <label class="variation-label">Tamanho / cor</label>
                        <select class="variation-select" ${disponivel ? "" : "disabled"}>
                            <option value="">Escolha uma opção</option>
                            ${variacoes.map((v, idx) => {
                                const est = Math.max(0, Math.floor(Number(v.estoque || 0)));
                                return `<option value="${idx}" ${est <= 0 ? "disabled" : ""}>${getVariacaoLabel(v)} — ${est} disp.</option>`;
                            }).join("")}
                        </select>
                    ` : "";
                    return `
                        <div class="product-card ${disponivel ? "" : "out-of-stock"}" data-id="${p.id}">
                            <div class="product-img-wrap">
                                <img class="product-img" src="${p.imagem}" alt="${p.nome}">
                                ${disponivel && estoque <= 3 ? `<span class="low-stock-seal">${estoque === 1 ? "Última unidade" : "Últimas unidades"}</span>` : ""}
                                ${disponivel ? "" : '<span class="stock-overlay">Indisponível</span>'}
                            </div>
                            <div class="product-info">
                                <h3 class="product-name">${p.nome}</h3>
                                <p class="product-description">${p.descricao}</p>
                                <p class="product-stock ${disponivel ? "available" : "unavailable"}">
                                    ${disponivel ? `Estoque: ${estoque} unidade(s)` : "Produto sem estoque"}
                                </p>
                                ${variacaoSelect}
                                <p class="product-price">${formatarMoeda(p.preco)}</p>
                                <button class="product-button" ${disponivel ? "" : "disabled"}>${disponivel ? "Comprar" : "Indisponível"}</button>
                                <button class="product-question-button" data-product="${p.nome}"><i class="fab fa-whatsapp"></i> Tirar dúvida</button>
                            </div>
                        </div>
                    `;
                })
                .join("");
        }
    };

    const adicionarAoCarrinho = (produtoId, productCard) => {
        const produto = produtos.find((p) => p.id === produtoId);
        if (!produto) return;
        const variacoes = getVariacoesProduto(produto);
        let variacaoIndex = null;
        let variacao = null;
        if (variacoes.length) {
            const select = productCard?.querySelector(".variation-select");
            if (!select || select.value === "") {
                alert("Escolha o tamanho/cor antes de comprar.");
                return;
            }
            variacaoIndex = Number(select.value);
            variacao = variacoes[variacaoIndex];
        }
        const estoque = variacao ? Math.max(0, Math.floor(Number(variacao.estoque || 0))) : getEstoqueProduto(produto);
        if (estoque <= 0) {
            alert("Este produto está sem estoque no momento.");
            return;
        }

        const cartKey = getCartKey(produtoId, variacaoIndex);
        const itemNoCarrinho = carrinho.find((item) => item.cartKey === cartKey);
        if (itemNoCarrinho) {
            if (itemNoCarrinho.quantidade >= estoque) {
                alert(`Só temos ${estoque} unidade(s) desta opção em estoque.`);
                return;
            }
            itemNoCarrinho.quantidade++;
        } else {
            carrinho.push({ ...produto, cartKey, variacaoIndex, variacaoLabel: variacao ? getVariacaoLabel(variacao) : "", quantidade: 1 });
        }
        if (productCard) animacaoVoarParaCarrinho(productCard);
        atualizarCarrinho();
    };

    const alterarQuantidade = (cartKey, acao) => {
        const item = carrinho.find((i) => i.cartKey === cartKey || String(i.id) === String(cartKey));
        if (!item) return;
        if (acao === "aumentar") {
            const estoque = getEstoqueItem(item);
            if (item.quantidade >= estoque) {
                alert(`Só temos ${estoque} unidade(s) desta opção em estoque.`);
                return;
            }
            item.quantidade++;
        }
        else if (acao === "diminuir") {
            item.quantidade--;
            if (item.quantidade <= 0)
                carrinho = carrinho.filter((i) => (i.cartKey || String(i.id)) !== (item.cartKey || String(item.id)));
        }
        atualizarCarrinho();
    };

    const atualizarCarrinho = () => {
        try {
            localStorage.setItem("erisfit_carrinho", JSON.stringify(carrinho.map((item) => ({ id: item.id, docId: item.docId, cartKey: item.cartKey, variacaoIndex: item.variacaoIndex ?? null, variacaoLabel: item.variacaoLabel || "", quantidade: item.quantidade }))));
        } catch (_) {}
        if (carrinho.length === 0) {
            cartBody.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-box-open"></i><p>Seu carrinho está vazio.</p></div>`;
        } else {
            cartBody.innerHTML = carrinho
                .map(
                    (item) =>
                        `<div class="cart-item" data-cart-key="${item.cartKey || item.id}" data-id="${item.id}"><img src="${item.imagem}" alt="${item.nome}" class="cart-item-img"><div class="cart-item-info"><h4 class="cart-item-name">${getItemNomeCompleto(item)}</h4><p class="cart-item-price">${formatarMoeda(item.preco)}</p><p class="cart-item-stock">Disponível: ${getEstoqueItem(item)}</p><div class="cart-item-controls"><button class="quantity-btn" data-action="diminuir">-</button><span class="quantity">${item.quantidade}</span><button class="quantity-btn" data-action="aumentar" ${item.quantidade >= getEstoqueItem(item) ? "disabled" : ""}>+</button></div></div><button class="remove-item-btn">&times;</button></div>`,
                )
                .join("");
        }
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );

        if (
            appliedCoupon &&
            appliedCoupon.valorMinimo &&
            subtotal < appliedCoupon.valorMinimo
        ) {
            appliedCoupon = null;
            couponFeedback.textContent =
                "Cupom removido: o pedido não atinge mais o valor mínimo exigido.";
            couponFeedback.classList.remove("success");
            couponFeedback.classList.add("error");
        }

        const discountAmount = calcularDesconto(subtotal);
        const entrega = tipoEntrega === "delivery" ? taxaEntrega : 0;
        const total = subtotal - discountAmount + entrega;
        subtotalElem.textContent = formatarMoeda(subtotal);
        if (discountAmount > 0) {
            cartDiscountElem.textContent = `- ${formatarMoeda(discountAmount)}`;
            discountLineElem.style.display = "flex";
        } else {
            discountLineElem.style.display = "none";
        }
        if (deliveryFeeLineElem && deliveryFeeElem) {
            if (tipoEntrega === "delivery" && (freteCalculado || entrega > 0)) {
                deliveryFeeElem.textContent = formatarMoeda(entrega);
                deliveryFeeLineElem.style.display = "flex";
            } else {
                deliveryFeeLineElem.style.display = "none";
            }
        }
        totalElem.textContent = formatarMoeda(total);
        cartBadge.textContent = carrinho.reduce(
            (acc, item) => acc + item.quantidade,
            0,
        );
        finishOrderBtn.disabled = carrinho.length === 0;
        if (mercadoPagoBtn) mercadoPagoBtn.disabled = carrinho.length === 0;

        if (carrinho.length > 0 && window.innerWidth <= 768) {
            bannerTotalElem.textContent = formatarMoeda(total);
            viewCartBanner.classList.add("show");
        } else {
            viewCartBanner.classList.remove("show");
        }
    };

    const calcularDesconto = (subtotal) => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.tipo === "fixo")
            return Math.min(appliedCoupon.valor, subtotal);
        return subtotal * (appliedCoupon.valor / 100);
    };

    const applyCoupon = () => {
        const code = couponInput.value.trim().toUpperCase();
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );
        const foundCoupon = coupons.find((c) => c.codigo === code);
        couponFeedback.classList.remove("success", "error");

        if (!foundCoupon) {
            appliedCoupon = null;
            couponFeedback.textContent = "Cupom inválido.";
            couponFeedback.classList.add("error");
        } else if (foundCoupon.ativo === false) {
            appliedCoupon = null;
            couponFeedback.textContent = "Este cupom não está mais disponível.";
            couponFeedback.classList.add("error");
        } else if (
            foundCoupon.validade &&
            new Date(`${foundCoupon.validade}T23:59:59`) < new Date()
        ) {
            appliedCoupon = null;
            couponFeedback.textContent = "Este cupom expirou.";
            couponFeedback.classList.add("error");
        } else if (
            foundCoupon.valorMinimo &&
            subtotal < foundCoupon.valorMinimo
        ) {
            appliedCoupon = null;
            couponFeedback.textContent = `Pedido mínimo de ${formatarMoeda(
                foundCoupon.valorMinimo,
            )} para usar este cupom.`;
            couponFeedback.classList.add("error");
        } else {
            appliedCoupon = foundCoupon;
            couponFeedback.textContent = "Cupom aplicado!";
            couponFeedback.classList.add("success");
        }
        atualizarCarrinho();
    };


    const validarFormularioPedido = async () => {
        let valid = true;
        let fieldsToValidate = [];

        if (tipoEntrega === "delivery") {
            fieldsToValidate = ["delivery-name", "delivery-phone", "delivery-cep", "delivery-address"];
        } else {
            fieldsToValidate = ["pickup-name", "pickup-phone", "pickup-date", "pickup-time"];
        }

        if (tipoEntrega === "pickup") {
            const dataInput = document.getElementById("pickup-date");
            if (dataInput.value) {
                const [ano, mes, dia] = dataInput.value.split("-").map(Number);
                const diaSemana = new Date(ano, mes - 1, dia).getDay();
                if (!configLoja.retiradaDias.includes(diaSemana)) {
                    dataInput.classList.add("error");
                    alert("A loja não realiza retiradas no dia selecionado. Escolha outra data.");
                    return false;
                }
            }
        }

        fieldsToValidate.forEach((id) => {
            const el = document.getElementById(id);
            let isFieldValid = el && el.value.trim() !== "";
            if (id.includes("name") && isFieldValid) {
                isFieldValid = el.value.trim().split(" ").filter((word) => word).length >= 2;
            }
            if (id.includes("phone") && isFieldValid) {
                isFieldValid = telefoneValido(el.value);
            }
            if (!isFieldValid) {
                if (el) el.classList.add("error");
                valid = false;
            } else {
                el.classList.remove("error");
            }
        });

        if (!valid) {
            alert("Por favor, preencha todos os campos obrigatórios marcados em vermelho.");
            return false;
        }

        if (tipoEntrega === "delivery") {
            const cepOk = await calcularFretePorCep(document.getElementById("delivery-cep").value, { silencioso: true });
            if (!cepOk) {
                alert("Informe um CEP válido para calcular a taxa de entrega.");
                document.getElementById("delivery-cep").classList.add("error");
                return false;
            }
        }

        const estoqueOk = verificarEstoqueCarrinho();
        if (!estoqueOk.ok) {
            alert(estoqueOk.mensagem);
            return false;
        }
        return true;
    };

    const montarPedidoMercadoPago = () => {
        const subtotal = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
        const desconto = calcularDesconto(subtotal);
        const entrega = tipoEntrega === "delivery" ? taxaEntrega : 0;
        const total = subtotal - desconto + entrega;

        let cliente = {};
        let entregaDados = null;
        if (tipoEntrega === "delivery") {
            cliente = {
                nome: document.getElementById("delivery-name").value.trim(),
                telefone: document.getElementById("delivery-phone").value.trim(),
            };
            entregaDados = {
                cep: aplicarMascaraCep(document.getElementById("delivery-cep").value),
                endereco: document.getElementById("delivery-address").value.trim(),
                bairro: cepDestinoInfo?.bairro || null,
                cidade: cepDestinoInfo?.localidade || null,
                uf: cepDestinoInfo?.uf || null,
                distanciaKm: distanciaEntregaKm,
                kmCobrados: kmCobradosEntrega,
            };
        } else {
            const dataInput = document.getElementById("pickup-date").value;
            const [year, month, day] = dataInput.split("-");
            cliente = {
                nome: document.getElementById("pickup-name").value.trim(),
                telefone: document.getElementById("pickup-phone").value.trim(),
            };
            entregaDados = {
                retiradaData: `${day}/${month}/${year}`,
                retiradaHora: document.getElementById("pickup-time").value,
            };
        }

        return {
            tipoEntrega,
            cliente,
            entregaDados,
            subtotal,
            desconto,
            entrega,
            total,
            itens: carrinho.map((item) => {
                const produtoAtual = produtos.find((p) => String(p.id) === String(item.id) || String(p.docId) === String(item.docId)) || item;
                return {
                    produtoId: getProdutoDocId(produtoAtual),
                    nome: getItemNomeCompleto(item),
                    quantidade: item.quantidade,
                    preco: item.preco,
                    variacaoIndex: item.variacaoIndex ?? null,
                    variacaoLabel: item.variacaoLabel || "",
                };
            }),
        };
    };

    const getMercadoPagoEndpoint = () => {
        const base = String(configLoja.functionsBaseUrl || "").replace(/\/$/, "");
        return base ? `${base}/createMercadoPagoPreference` : "/api/createMercadoPagoPreference";
    };

    const pagarComMercadoPago = async () => {
        if (!(await validarFormularioPedido())) return;
        if (!confirm("Você será encaminhada para o Mercado Pago. O estoque ficará reservado temporariamente até a confirmação do pagamento.")) return;

        const pedido = montarPedidoMercadoPago();
        mercadoPagoBtn.disabled = true;
        const textoOriginal = mercadoPagoBtn.innerHTML;
        mercadoPagoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando pagamento...';
        try {
            const resp = await fetch(getMercadoPagoEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedido),
            });
            const raw = await resp.text();
            let data = null;
            try { data = raw ? JSON.parse(raw) : {}; }
            catch (_) {
                throw new Error("A API de pagamento não respondeu em JSON. Confira se a pasta api/, package.json e vercel.json foram enviados ao GitHub e se a Vercel fez redeploy.");
            }
            if (!resp.ok || !data.init_point) throw new Error(data.error || "Não foi possível gerar o pagamento.");
            window.location.href = data.init_point;
        } catch (e) {
            alert(`Erro ao gerar pagamento pelo Mercado Pago: ${e.message}\n\nConfira se as variáveis da Vercel foram configuradas, se a pasta api/ foi publicada e se o Mercado Pago foi configurado.`);
            mercadoPagoBtn.disabled = false;
            mercadoPagoBtn.innerHTML = textoOriginal;
        }
    };

    const finalizarPedido = async () => {
        let valid = true;
        let fieldsToValidate = [];

        if (tipoEntrega === "delivery") {
            fieldsToValidate = [
                "delivery-name",
                "delivery-phone",
                "delivery-cep",
                "delivery-address",
            ];
        } else {
            fieldsToValidate = ["pickup-name", "pickup-phone", "pickup-date", "pickup-time"];
        }

        if (tipoEntrega === "pickup") {
            const dataInput = document.getElementById("pickup-date");
            if (dataInput.value) {
                const [ano, mes, dia] = dataInput.value.split("-").map(Number);
                const diaSemana = new Date(ano, mes - 1, dia).getDay();
                if (!configLoja.retiradaDias.includes(diaSemana)) {
                    dataInput.classList.add("error");
                    alert("A loja não realiza retiradas no dia selecionado. Escolha outra data.");
                    return;
                }
            }
        }

        fieldsToValidate.forEach((id) => {
            const el = document.getElementById(id);
            let isFieldValid = el.value.trim() !== "";

            if (id.includes("name") && isFieldValid) {
                if (
                    el.value
                        .trim()
                        .split(" ")
                        .filter((word) => word).length < 2
                ) {
                    isFieldValid = false;
                }
            }

            if (id.includes("phone") && isFieldValid) {
                isFieldValid = telefoneValido(el.value);
            }

            if (!isFieldValid) {
                el.classList.add("error");
                valid = false;
            } else {
                el.classList.remove("error");
            }
        });

        if (!valid) {
            alert(
                "Por favor, preencha todos os campos obrigatórios marcados em vermelho.",
            );
            return;
        }

        if (tipoEntrega === "delivery") {
            const cepOk = await calcularFretePorCep(document.getElementById("delivery-cep").value, { silencioso: true });
            if (!cepOk) {
                alert("Informe um CEP válido para calcular a taxa de entrega.");
                document.getElementById("delivery-cep").classList.add("error");
                return;
            }
        }

        // Pedido por WhatsApp não baixa estoque automaticamente.
        // A baixa segura acontece pelo pagamento online aprovado ou pelo PDV/admin.
        const numeroWhatsApp = configLoja.whatsapp;
        const itensPedido = carrinho
            .map((item) => `  - ${item.quantidade}x ${getItemNomeCompleto(item)}`)
            .join("\n");
        const subtotal = carrinho.reduce(
            (acc, item) => acc + item.preco * item.quantidade,
            0,
        );
        const discountAmount = calcularDesconto(subtotal);
        let cupomInfo = "";
        if (appliedCoupon) {
            cupomInfo = `\n*Cupom Aplicado:* ${appliedCoupon.codigo} (${formatarMoeda(discountAmount)})`;
        }
        const entrega = tipoEntrega === "delivery" ? taxaEntrega : 0;
        const freteInfo = tipoEntrega === "delivery" ? `
*Entrega:* ${formatarMoeda(entrega)}` : "";
        const total = subtotal - discountAmount + entrega;
        let mensagem = `*-- NOVO PEDIDO ${configLoja.nomeLoja} --*

*Itens:*
${itensPedido}

*Subtotal:* ${formatarMoeda(subtotal)}${cupomInfo}${freteInfo}
*Total:* ${formatarMoeda(total)}

-------------------------

`;

        if (tipoEntrega === "delivery") {
            const nome = document.getElementById("delivery-name").value;
            const phone = document.getElementById("delivery-phone").value;
            const cep = aplicarMascaraCep(document.getElementById("delivery-cep").value);
            const address = document.getElementById("delivery-address").value;

            const paymentMethod = document.querySelector(
                'input[name="payment"]:checked',
            ).value;
            let paymentInfo = `*Forma de Pagamento:* ${paymentMethod}`;
            if (paymentMethod === "Dinheiro") {
                const troco = document.getElementById("troco-para").value;
                paymentInfo += troco
                    ? ` (Troco para R$ ${troco})`
                    : " (Não precisa de troco)";
            }
            const destinoCepInfo = cepDestinoInfo
                ? `\n*Bairro/Cidade:* ${cepDestinoInfo.bairro || "-"} - ${cepDestinoInfo.localidade || ""}/${cepDestinoInfo.uf || ""}`
                : "";
            const distanciaInfo = distanciaEntregaKm !== null
                ? `\n*Distância aprox.:* ${distanciaEntregaKm.toFixed(1).replace(".", ",")} km\n*Km cobrados:* ${kmCobradosEntrega} km`
                : "";
            mensagem += `*Tipo de Pedido:* Entrega\n\n*Nome:* ${nome}\n*Telefone:* ${phone}\n*CEP:* ${cep}${destinoCepInfo}\n*Endereço:* ${address}${distanciaInfo}\n*Frete:* ${formatarMoeda(entrega)}\n\n${paymentInfo}`;
        } else {
            const nome = document.getElementById("pickup-name").value;
            const phone = document.getElementById("pickup-phone").value;
            const dataInput = document.getElementById("pickup-date").value;
            const hora = document.getElementById("pickup-time").value;
            const [year, month, day] = dataInput.split("-");
            const dataFormatada = `${day}/${month}/${year}`;

            mensagem += `*Tipo de Pedido:* Retirada\n\n*Nome para Retirada:* ${nome}\n*Telefone:* ${phone}\n*Data Agendada:* ${dataFormatada}\n*Hora Agendada:* ${hora}`;
        }

        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, "_blank");

        carrinho = [];
        try { localStorage.removeItem("erisfit_carrinho"); } catch (_) {}
        appliedCoupon = null;
        if (couponInput) couponInput.value = "";
        if (couponFeedback) couponFeedback.textContent = "";
        filtrarEMostrarProdutos();
        atualizarCarrinho();
    };

    // --- EVENT LISTENERS ---
    cartIcon.addEventListener("click", abrirCarrinho);
    closeCartBtn.addEventListener("click", fecharCarrinho);
    cartOverlay.addEventListener("click", fecharCarrinho);
    applyCouponBtn.addEventListener("click", applyCoupon);
    finishOrderBtn.addEventListener("click", finalizarPedido);
    if (mercadoPagoBtn) mercadoPagoBtn.addEventListener("click", pagarComMercadoPago);
    viewCartBannerBtn.addEventListener("click", abrirCarrinho);

    [deliveryPhoneInput, pickupPhoneInput].filter(Boolean).forEach((input) => {
        input.addEventListener("input", (e) => {
            e.target.value = aplicarMascaraTelefone(e.target.value);
            e.target.classList.remove("error");
        });
        input.addEventListener("blur", (e) => {
            if (e.target.value && !telefoneValido(e.target.value)) {
                e.target.classList.add("error");
            }
        });
    });

    if (deliveryCepInput) {
        setAvisoFrete(
            `Digite o CEP para calcular a entrega. Frete: R$ 1,00 por km, arredondando para cima. Saída: ${configLoja.enderecoLoja || "Av. Independência, 2621 - Quintino Cunha"}.`,
        );
        deliveryCepInput.addEventListener("input", (e) => {
            e.target.value = aplicarMascaraCep(e.target.value);
            e.target.classList.remove("error");
            clearTimeout(freteTimer);
            const cep = limparCep(e.target.value);
            if (cep.length === 8) {
                freteTimer = setTimeout(() => calcularFretePorCep(cep), 450);
            } else {
                taxaEntrega = 0;
                distanciaEntregaKm = null;
                kmCobradosEntrega = 0;
                freteCalculado = false;
                cepDestinoInfo = null;
                setAvisoFrete(
                    `Digite o CEP completo para calcular a entrega. Frete: R$ 1,00 por km, arredondando para cima.`,
                );
                atualizarCarrinho();
            }
        });
        deliveryCepInput.addEventListener("blur", () => {
            const cep = limparCep(deliveryCepInput.value);
            if (cep.length === 8) calcularFretePorCep(cep);
        });
    }

    // Event listener para botões de categoria
    categoryBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            // Remove classe active de todos os botões
            categoryBtns.forEach((b) => b.classList.remove("active"));
            // Adiciona classe active no botão clicado
            btn.classList.add("active");
            // Atualiza categoria ativa
            categoriaAtiva = btn.dataset.category;
            // Filtra e mostra produtos
            filtrarEMostrarProdutos();
        });
    });

    // Event listener para campo de busca
    searchInput.addEventListener("input", (e) => {
        termoBusca = e.target.value;
        filtrarEMostrarProdutos();
    });

    document.querySelector(".home-highlights")?.addEventListener("click", (e) => {
        const btn = e.target.closest(".mini-buy-btn");
        if (!btn) return;
        const produtoId = Number.parseInt(btn.dataset.id);
        const produtoCard = document.querySelector(`.product-card[data-id="${produtoId}"]`);
        if (produtoCard && getVariacoesProduto(produtos.find((p) => p.id === produtoId)).length) {
            produtoCard.scrollIntoView({ behavior: "smooth", block: "center" });
            alert("Escolha o tamanho/cor no produto antes de comprar.");
            return;
        }
        adicionarAoCarrinho(produtoId, produtoCard);
    });

    document
        .querySelector(".products-container")
        .addEventListener("click", (e) => {
            if (e.target.closest(".product-question-button")) {
                const btn = e.target.closest(".product-question-button");
                const produto = btn.dataset.product || "produto";
                const msg = `Olá, tenho interesse no produto ${produto}. Pode me ajudar?`;
                window.open(`https://wa.me/${configLoja.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
                return;
            }
            if (e.target.matches(".product-button")) {
                const productCard = e.target.closest(".product-card");
                adicionarAoCarrinho(
                    Number.parseInt(productCard.dataset.id),
                    productCard,
                );
            }
        });
    cartBody.addEventListener("click", (e) => {
        const cartItem = e.target.closest(".cart-item");
        if (cartItem) {
            const cartKey = cartItem.dataset.cartKey || cartItem.dataset.id;
            if (e.target.matches(".quantity-btn"))
                alterarQuantidade(cartKey, e.target.dataset.action);
            if (e.target.matches(".remove-item-btn")) {
                carrinho = carrinho.filter((i) => (i.cartKey || String(i.id)) !== String(cartKey));
                atualizarCarrinho();
            }
        }
    });

    deliveryToggleBtns.forEach((btn) =>
        btn.addEventListener("click", () => {
            deliveryToggleBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            tipoEntrega = btn.dataset.option;
            if (tipoEntrega === "delivery") {
                deliveryForm.style.display = "block";
                pickupForm.style.display = "none";
                if (deliveryCepInput && limparCep(deliveryCepInput.value).length === 8 && !freteCalculado) {
                    calcularFretePorCep(deliveryCepInput.value);
                }
            } else {
                deliveryForm.style.display = "none";
                pickupForm.style.display = "block";
            }
            atualizarCarrinho();
        }),
    );

    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            trocoContainer.style.display =
                e.target.value === "Dinheiro" ? "block" : "none";
            document
                .querySelectorAll(".payment-option")
                .forEach((label) => label.classList.remove("selected"));
            e.target.closest(".payment-option").classList.add("selected");
        });
    });

    // Remove o erro ao digitar
    document
        .querySelectorAll(
            "#delivery-form-container input[required], #pickup-form-container input[required], #pickup-form-container select[required]",
        )
        .forEach((input) => {
            input.addEventListener("input", () => {
                if (input.value.trim() !== "") input.classList.remove("error");
            });
        });

    // --- INICIALIZAÇÃO ---
    filtrarEMostrarProdutos();
    atualizarCarrinho();
});
