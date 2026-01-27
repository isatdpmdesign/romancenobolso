import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        console.log("📥 Webhook recebido:", JSON.stringify(body, null, 2));
        
        // Mercado Pago envia notificações de diferentes tipos
        if (body.type !== "payment") {
            console.log("⏭️ Tipo ignorado:", body.type);
            return Response.json({ received: true });
        }

        const paymentId = body.data?.id;
        
        if (!paymentId) {
            console.log("❌ Payment ID não encontrado");
            return Response.json({ received: true });
        }

        console.log("🔍 Buscando pagamento:", paymentId);
        const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

        // Buscar detalhes do pagamento
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        const payment = await paymentResponse.json();
        console.log("💳 Dados do pagamento:", JSON.stringify(payment, null, 2));

        if (payment.status === "approved") {
            console.log("✅ Pagamento aprovado!");
            
            // Extrair informações do external_reference: bookId_userEmail_timestamp
            const [bookId, userEmail] = payment.external_reference.split("_");
            console.log("📚 BookID:", bookId, "| Email:", userEmail);

            // Verificar se já existe compra
            const existingPurchases = await base44.asServiceRole.entities.Purchase.filter({
                user_email: userEmail,
                book_id: bookId,
                status: "completed"
            });
            console.log("🔍 Compras existentes:", existingPurchases.length);

            if (existingPurchases.length === 0) {
                console.log("💾 Criando registro de compra...");
                
                // Criar registro de compra
                const purchase = await base44.asServiceRole.entities.Purchase.create({
                    user_email: userEmail,
                    book_id: bookId,
                    payment_method: payment.payment_method_id || "credit_card",
                    amount: payment.transaction_amount,
                    status: "completed"
                });
                console.log("✅ Compra registrada:", purchase.id);

                // Buscar informações do livro
                const books = await base44.asServiceRole.entities.Book.list();
                const book = books.find(b => b.id === bookId);
                console.log("📖 Livro encontrado:", book?.title);

                // Buscar primeiro capítulo
                const chapters = await base44.asServiceRole.entities.Chapter.filter(
                    { book_id: bookId }, 
                    'chapter_number', 
                    1
                );
                console.log("📄 Capítulos encontrados:", chapters.length);

                if (book && chapters.length > 0) {
                    const baseUrl = Deno.env.get("BASE_URL");
                    const readerUrl = `${baseUrl}/Reader?bookId=${bookId}&chapterId=${chapters[0].id}`;
                    console.log("🔗 URL do leitor:", readerUrl);

                    // Enviar email de confirmação
                    console.log("📧 Enviando email para:", userEmail);
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: "Romance no Bolso",
                        to: userEmail,
                        subject: `✅ Compra confirmada: ${book.title}`,
                        body: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #FF0864;">🎉 Pagamento confirmado!</h2>
                                <p>Olá!</p>
                                <p>Sua compra de <strong>${book.title}</strong> foi confirmada com sucesso!</p>
                                <p>Você agora tem acesso completo a todos os ${book.total_chapters || 'capítulos'} do livro.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${readerUrl}" style="background-color: #FF0864; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                        📖 Começar a Ler Agora
                                    </a>
                                </div>
                                <p style="color: #666; font-size: 14px;">Valor pago: R$ ${payment.transaction_amount.toFixed(2)}</p>
                                <p style="color: #666; font-size: 14px;">Método: Cartão de Crédito</p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                <p style="color: #999; font-size: 12px;">Romance no Bolso - Histórias que cabem no seu dia a dia ❤️</p>
                            </div>
                        `
                    });
                    console.log("✅ Email enviado com sucesso!");
                } else {
                    console.log("⚠️ Livro ou capítulos não encontrados");
                }
            } else {
                console.log("⏭️ Compra já existe, pulando...");
            }
        } else {
            console.log("⏸️ Status do pagamento:", payment.status);
        }

        console.log("✅ Webhook processado com sucesso");
        return Response.json({ received: true, processed: true });

    } catch (error) {
        console.error("❌ Erro no webhook:", error.message);
        console.error("Stack:", error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});