import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { bookId, bookTitle, bookPrice, origin } = await req.json();

        if (!bookId || !bookTitle || !bookPrice) {
            return Response.json({ error: 'Dados do livro inválidos' }, { status: 400 });
        }

        const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

        if (!accessToken) {
            return Response.json({ error: 'Token do Mercado Pago não configurado' }, { status: 500 });
        }

        const baseUrl = origin || req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');

        // Criar preferência de pagamento no Mercado Pago - CARTÃO DE CRÉDITO
        const preference = {
            items: [
                {
                    id: bookId,
                    title: bookTitle,
                    description: "Acesso digital a conteúdo literário original (histórias românticas), disponibilizado online após a confirmação do pagamento. Produto digital, sem envio físico.",
                    category_id: "digital_content",
                    quantity: 1,
                    unit_price: Number(bookPrice),
                    currency_id: "BRL"
                }
            ],
            payer: {
                email: user.email,
                name: user.full_name || ""
            },
            payment_methods: {
                excluded_payment_methods: [
                    { id: "pix" }
                ],
                excluded_payment_types: [
                    { id: "ticket" },
                    { id: "atm" },
                    { id: "debit_card" }
                ],
                installments: 12
            },
            back_urls: {
                success: `${baseUrl}/Payment?bookId=${bookId}&status=success`,
                failure: `${baseUrl}/Payment?bookId=${bookId}&status=failure`,
                pending: `${baseUrl}/Payment?bookId=${bookId}&status=pending`
            },
            auto_return: "approved",
            notification_url: `${baseUrl}/api/functions/mercadoPagoWebhook`,
            external_reference: `${bookId}_${user.email}_${Date.now()}`
        };

        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(preference)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro Mercado Pago:", JSON.stringify(data));
            return Response.json({ 
                error: 'Erro ao criar pagamento', 
                details: data.message || data.error || JSON.stringify(data)
            }, { status: 500 });
        }

        return Response.json({
            checkout_url: data.init_point,
            preference_id: data.id
        });

    } catch (error) {
        console.error("Erro:", error);
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});