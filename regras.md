# Regras do Firestore — Erisfit

Copie o bloco abaixo e cole no Console do Firebase:

**Firestore Database → Regras** → apague o conteúdo atual → cole isto → **Publicar**.

> Versão reforçada para Mercado Pago/Vercel: visitantes podem ler produtos e acompanhar o status de um pedido pelo link, mas não podem alterar estoque nem criar/editar produtos. A baixa e devolução de estoque ficam com a API segura da Vercel/Firebase Admin.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /produtos/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /categorias/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /cupons/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /configuracoes/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /pedidos/{doc} {
      // Permite que a cliente veja o status do próprio pedido quando tiver o link/ID.
      // A criação, cancelamento, atualização de pagamento e devolução de estoque são feitos pela API segura.
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /vendas/{doc} {
      allow read, write: if request.auth != null;
    }

    match /historico/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## O que essas regras fazem

- **produtos**: qualquer visitante pode ver, mas só a administradora logada pode editar pelo admin. O cliente não consegue alterar estoque direto pelo site.
- **pedidos**: a cliente consegue consultar o status quando tiver o link do pedido. Escrita fica protegida.
- **categorias, cupons e configurações**: visitantes podem ler; só admin pode alterar.
- **vendas**: somente admin pode ler e escrever.
- **historico**: registra ações feitas no admin e só admin pode ler/escrever.

## Importante

Com essas regras, o estoque seguro do Mercado Pago depende das APIs da Vercel:

- `/api/createMercadoPagoPreference`
- `/api/webhookMercadoPago`
- `/api/updateMercadoPagoStatus`
- `/api/cancelPedido`
- `/api/expirePendingOrders`

Configure na Vercel as variáveis:

- `MP_ACCESS_TOKEN`
- `MP_BACK_URL`
- `MP_WEBHOOK_URL`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `CRON_SECRET`
- `ALLOWED_ORIGIN` (opcional, exemplo `https://eris-fit.vercel.app`)
