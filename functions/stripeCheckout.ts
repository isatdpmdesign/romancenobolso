import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.error('❌ Usuário não autenticado');
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { bookId, bookTitle, bookPrice, origin } = await req.json();

        if (!bookId || !bookTitle || !bookPrice) {
            console.error('❌ Dados do livro inválidos:', { bookId, bookTitle, bookPrice });
            return Response.json({ error: 'Dados do livro inválidos' }, { status: 400 });
        }

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            console.error('❌ STRIPE_SECRET_KEY não configurada');
            return Response.json({ error: 'Stripe não configurado' }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey);

        const baseUrl = origin || req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');

        console.log('🛒 Criando checkout Stripe:', { bookId, bookTitle, bookPrice, userEmail: user.email });

        // Criar sessão de checkout do Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: bookTitle,
                            description: 'Acesso digital completo ao livro',
                        },
                        unit_amount: Math.round(bookPrice * 100), // Converter para centavos
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/Payment?bookId=${bookId}&status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/Payment?bookId=${bookId}&status=cancelled`,
            customer_email: user.email,
            metadata: {
                base44_app_id: Deno.env.get("BASE44_APP_ID"),
                book_id: bookId,
                user_email: user.email,
            },
        });

        console.log('✅ Checkout criado:', session.id);

        return Response.json({
            checkout_url: session.url,
            session_id: session.id
        });

    } catch (error) {
        console.error('❌ Erro ao criar checkout:', error);
        return Response.json({ 
            error: error.message, 
            stack: error.stack 
        }, { status: 500 });
    }
});