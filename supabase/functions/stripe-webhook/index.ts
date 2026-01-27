/**
 * Supabase Edge Function: stripe-webhook
 * 
 * Esta função processa webhooks do Stripe e envia os dados para o Make.com
 * 
 * CONFIGURAÇÃO DE SECRETS NO SUPABASE:
 * 
 * 1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
 * 2. Vá em: Project Settings > Edge Functions > Secrets
 * 3. Adicione os seguintes secrets:
 * 
 *    - STRIPE_SECRET_KEY: Sua chave secreta do Stripe (sk_test_... ou sk_live_...)
 *      Obtenha em: https://dashboard.stripe.com/apikeys
 * 
 *    - STRIPE_WEBHOOK_SECRET: O secret do endpoint do webhook no Stripe
 *      Obtenha em: https://dashboard.stripe.com/webhooks
 *      > Selecione seu webhook > Reveal signing secret
 * 
 *    - MAKE_WEBHOOK_URL: A URL do webhook do Make.com
 *      [COLE AQUI SUA URL DO MAKE]
 *      Exemplo: https://hook.eu1.make.com/xxxxxxxxxxxxx
 * 
 * 4. Para adicionar via CLI (opcional):
 *    supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
 *    supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
 *    supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx
 */

import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';

Deno.serve(async (req) => {
  try {
    // 1. Verificar se as variáveis de ambiente estão configuradas
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const makeWebhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');

    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Stripe secret key não configurada' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET não configurada');
      return new Response(
        JSON.stringify({ error: 'Stripe webhook secret não configurada' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!makeWebhookUrl) {
      console.error('❌ MAKE_WEBHOOK_URL não configurada');
      return new Response(
        JSON.stringify({ error: 'Make.com webhook URL não configurada' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Inicializar cliente Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // 3. Obter o body e a assinatura do webhook
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Assinatura do webhook não encontrada');
      return new Response(
        JSON.stringify({ error: 'Signature header missing' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Validar a assinatura do webhook
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      console.log('✅ Assinatura do webhook validada');
    } catch (err) {
      console.error('❌ Erro ao verificar assinatura:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Processar apenas eventos de checkout completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('📥 Evento recebido: checkout.session.completed');
      console.log('📋 Session ID:', session.id);

      // 6. Extrair metadados (email do cliente e book_id)
      const userEmail = session.customer_email || session.metadata?.user_email;
      const bookId = session.metadata?.book_id;

      if (!userEmail) {
        console.error('❌ Email do cliente não encontrado nos metadados');
        return new Response(
          JSON.stringify({ error: 'Customer email not found in metadata' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!bookId) {
        console.error('❌ book_id não encontrado nos metadados');
        return new Response(
          JSON.stringify({ error: 'book_id not found in metadata' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('📧 Email do cliente:', userEmail);
      console.log('📚 Book ID:', bookId);

      // 7. Preparar dados para enviar ao Make.com
      const makePayload = {
        event_type: 'checkout.session.completed',
        session_id: session.id,
        user_email: userEmail,
        book_id: bookId,
        amount_total: session.amount_total ? session.amount_total / 100 : null, // Converter de centavos para reais
        currency: session.currency,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        metadata: session.metadata,
        timestamp: new Date().toISOString()
      };

      // 8. Enviar POST para o Make.com
      try {
        console.log('📤 Enviando dados para Make.com...');
        const makeResponse = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(makePayload),
        });

        if (!makeResponse.ok) {
          const errorText = await makeResponse.text();
          console.error('❌ Erro ao enviar para Make.com:', makeResponse.status, errorText);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to send data to Make.com',
              makeStatus: makeResponse.status,
              makeError: errorText
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        const makeResult = await makeResponse.json().catch(() => ({}));
        console.log('✅ Dados enviados com sucesso para Make.com');
        console.log('📦 Resposta do Make.com:', JSON.stringify(makeResult, null, 2));

        // 9. Retornar sucesso
        return new Response(
          JSON.stringify({ 
            received: true,
            event_type: event.type,
            session_id: session.id,
            make_response: makeResult
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );

      } catch (fetchError) {
        console.error('❌ Erro ao fazer requisição para Make.com:', fetchError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send data to Make.com',
            details: fetchError.message
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

    } else {
      // Evento não é checkout.session.completed - apenas logar e retornar sucesso
      console.log(`ℹ️ Evento ignorado: ${event.type}`);
      return new Response(
        JSON.stringify({ 
          received: true,
          event_type: event.type,
          message: 'Event type not processed'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
