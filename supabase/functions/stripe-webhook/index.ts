/**
 * Supabase Edge Function: stripe-webhook
 * Esta função processa webhooks do Stripe e envia os dados para o Make.com
 */

import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';

Deno.serve(async (req) => {
  try {
    // 1. Verificar se as variáveis de ambiente estão configuradas
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const makeWebhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');

    if (!stripeSecretKey || !webhookSecret || !makeWebhookUrl) {
      console.error('❌ Faltam configurações de Secrets no Supabase');
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta nos Secrets do Supabase' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(JSON.stringify({ error: 'Signature header missing' }), { status: 400 });
    }

    // 4. Validar a assinatura do webhook
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('✅ Assinatura do webhook validada');
    } catch (err) {
      console.error('❌ Erro ao verificar assinatura:', err.message);
      return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), { status: 400 });
    }

    // 5. Processar apenas eventos de checkout completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('📥 Evento recebido: checkout.session.completed');

      // 6. EXTRAÇÃO BLINDADA (Busca e-mail e ID em todas as fontes possíveis)
      const userEmail = 
        session.customer_details?.email || 
        session.customer_email || 
        session.metadata?.user_email || 
        session.metadata?.email;

      // Aceita tanto 'livro_id' (Português) quanto 'book_id' (Inglês)
      const bookId = session.metadata?.livro_id || session.metadata?.book_id;

      // Log para diagnóstico se der erro 400
      if (!userEmail || !bookId) {
        console.error('❌ Dados ausentes no Stripe:', { userEmail, bookId, metadata: session.metadata });
        return new Response(
          JSON.stringify({ 
            error: 'Dados obrigatórios não encontrados',
            detail: !userEmail ? 'E-mail não identificado' : 'ID do livro (livro_id) não encontrado'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('📧 E-mail identificado:', userEmail);
      console.log('📚 Livro identificado:', bookId);

      // 7. Preparar dados para enviar ao Make.com
      const makePayload = {
        event_type: 'checkout.session.completed',
        session_id: session.id,
        user_email: userEmail,
        book_id: bookId,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        payment_status: session.payment_status,
        customer_name: session.customer_details?.name || 'Cliente',
        timestamp: new Date().toISOString()
      };

      // 8. Enviar POST para o Make.com
      console.log('📤 Enviando para Make.com...');
      const makeResponse = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makePayload),
      });

      if (!makeResponse.ok) {
        const errorText = await makeResponse.text();
        console.error('❌ Erro no Make.com:', makeResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'Erro ao avisar o Make.com' }), { status: 500 });
      }

      console.log('✅ Sucesso! Make avisado e e-mail a caminho.');
      return new Response(JSON.stringify({ received: true }), { status: 200 });

    } else {
      console.log(`ℹ️ Evento ignorado: ${event.type}`);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), { status: 500 });
  }
});