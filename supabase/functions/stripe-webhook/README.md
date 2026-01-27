# Stripe Webhook - Supabase Edge Function

Esta Edge Function processa webhooks do Stripe e envia os dados para o Make.com.

## Configuração

### 1. Secrets do Supabase

Configure os seguintes secrets no Dashboard do Supabase:

1. Acesse: **Project Settings > Edge Functions > Secrets**
2. Adicione:

   - **STRIPE_SECRET_KEY**: Sua chave secreta do Stripe
     - Obtenha em: https://dashboard.stripe.com/apikeys
     - Formato: `sk_test_...` (teste) ou `sk_live_...` (produção)

   - **STRIPE_WEBHOOK_SECRET**: O secret do endpoint do webhook
     - Obtenha em: https://dashboard.stripe.com/webhooks
     - Selecione seu webhook > Clique em "Reveal signing secret"
     - Formato: `whsec_...`

   - **MAKE_WEBHOOK_URL**: A URL do webhook do Make.com
     - Exemplo: `https://hook.eu1.make.com/xxxxxxxxxxxxx`
     - Obtenha criando um webhook no seu cenário do Make.com

### 2. Configuração via CLI (Opcional)

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx
```

### 3. Deploy da Function

```bash
# Deploy da function
supabase functions deploy stripe-webhook

# Ou deploy de todas as functions
supabase functions deploy
```

### 4. Configurar Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL do endpoint: `https://seu-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Eventos para escutar: Selecione `checkout.session.completed`
5. Copie o "Signing secret" e configure no Supabase (STRIPE_WEBHOOK_SECRET)

## Estrutura dos Dados Enviados ao Make.com

Quando um checkout é completado, a função envia um POST JSON com:

```json
{
  "event_type": "checkout.session.completed",
  "session_id": "cs_test_...",
  "user_email": "cliente@email.com",
  "book_id": "book_123",
  "amount_total": 29.90,
  "currency": "brl",
  "payment_status": "paid",
  "customer_email": "cliente@email.com",
  "metadata": {
    "book_id": "book_123",
    "user_email": "cliente@email.com"
  },
  "timestamp": "2026-01-27T12:00:00.000Z"
}
```

## Testando

### Teste Local (com Supabase CLI)

```bash
# Iniciar Supabase localmente
supabase start

# Testar a function localmente
supabase functions serve stripe-webhook

# Em outro terminal, testar com curl
curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test_signature" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"test"}}}'
```

### Teste com Stripe CLI

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Fazer login
stripe login

# Escutar eventos e encaminhar para a function local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Em outro terminal, disparar um evento de teste
stripe trigger checkout.session.completed
```

## Logs

Para ver os logs da function:

```bash
# Logs em tempo real
supabase functions logs stripe-webhook --follow

# Logs recentes
supabase functions logs stripe-webhook
```

Ou no Dashboard do Supabase: **Edge Functions > stripe-webhook > Logs**

## Troubleshooting

### Erro: "STRIPE_SECRET_KEY não configurada"
- Verifique se o secret foi configurado corretamente no Supabase
- Use `supabase secrets list` para verificar

### Erro: "Webhook signature verification failed"
- Verifique se o STRIPE_WEBHOOK_SECRET está correto
- Certifique-se de que está usando o secret do endpoint correto no Stripe

### Erro: "Failed to send data to Make.com"
- Verifique se a URL do Make.com está correta
- Teste a URL do webhook do Make.com manualmente com um POST
- Verifique os logs do Make.com para ver se recebeu a requisição
