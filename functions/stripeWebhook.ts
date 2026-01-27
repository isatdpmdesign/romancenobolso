import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            console.error('❌ STRIPE_SECRET_KEY não configurada');
            return Response.json({ error: 'Stripe não configurado' }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey);
        const base44 = createClientFromRequest(req);

        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        let event;

        // Verificar assinatura do webhook (se STRIPE_WEBHOOK_SECRET estiver configurado)
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        if (webhookSecret && signature) {
            try {
                event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
            } catch (err) {
                console.error('❌ Erro ao verificar assinatura:', err.message);
                return Response.json({ error: 'Invalid signature' }, { status: 400 });
            }
        } else {
            event = JSON.parse(body);
        }

        console.log('📥 Webhook recebido:', event.type);

        // Processar apenas eventos de checkout completado
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('✅ Checkout completado:', session.id);

            const { book_id, user_email } = session.metadata;

            if (!book_id || !user_email) {
                console.error('❌ Metadata incompleta:', session.metadata);
                return Response.json({ error: 'Metadata incompleta' }, { status: 400 });
            }

            // Verificar se já existe compra registrada
            const existingPurchases = await base44.asServiceRole.entities.Purchase.filter({
                user_email,
                book_id,
                status: 'completed'
            });

            if (existingPurchases.length > 0) {
                console.log('⚠️ Compra já registrada');
                return Response.json({ message: 'Compra já registrada' });
            }

            // Buscar informações do livro
            const books = await base44.asServiceRole.entities.Book.list();
            const book = books.find(b => b.id === book_id);

            if (!book) {
                console.error('❌ Livro não encontrado:', book_id);
                return Response.json({ error: 'Livro não encontrado' }, { status: 404 });
            }

            // Criar registro de compra
            await base44.asServiceRole.entities.Purchase.create({
                user_email,
                book_id,
                payment_method: 'credit_card',
                amount: session.amount_total / 100, // Converter de centavos para reais
                status: 'completed'
            });

            console.log('✅ Compra registrada com sucesso');

            // Enviar email de confirmação
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user_email,
                    subject: `🎉 Pagamento confirmado - ${book.title}`,
                    body: `
                        <h2>Obrigado pela sua compra!</h2>
                        <p>Seu pagamento para o livro <strong>${book.title}</strong> foi confirmado.</p>
                        <p>Você já pode acessar todos os capítulos!</p>
                        <p>Boa leitura! 📚</p>
                    `
                });
                console.log('📧 Email enviado para:', user_email);
            } catch (emailError) {
                console.error('❌ Erro ao enviar email:', emailError);
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});