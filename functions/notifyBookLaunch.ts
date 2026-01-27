import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('🚀 Iniciando verificação de lançamentos de livros...');

    // Buscar livros que foram publicados hoje
    const today = new Date().toISOString().split('T')[0];
    const allBooks = await base44.asServiceRole.entities.Book.list();
    
    const booksLaunchedToday = allBooks.filter(book => {
      if (!book.publish_date || book.status !== 'published') return false;
      const publishDate = book.publish_date.split('T')[0];
      return publishDate === today;
    });

    console.log(`📚 ${booksLaunchedToday.length} livros lançados hoje:`, booksLaunchedToday.map(b => b.title));

    if (booksLaunchedToday.length === 0) {
      console.log('✅ Nenhum livro para notificar hoje');
      return Response.json({ 
        success: true, 
        message: 'Nenhum livro lançado hoje',
        booksChecked: allBooks.length 
      });
    }

    let totalNotified = 0;

    // Para cada livro lançado, notificar usuários interessados
    for (const book of booksLaunchedToday) {
      console.log(`📖 Processando livro: ${book.title}`);
      
      // Buscar usuários interessados que ainda não foram notificados
      const interests = await base44.asServiceRole.entities.BookInterest.filter({ 
        book_id: book.id,
        notified: false
      });

      console.log(`👥 ${interests.length} usuários interessados no livro "${book.title}"`);

      for (const interest of interests) {
        try {
          // Criar notificação no app
          await base44.asServiceRole.entities.Notification.create({
            user_email: interest.user_email,
            type: 'new_book',
            title: `📚 "${book.title}" foi lançado!`,
            message: `O livro que você estava aguardando já está disponível. Comece a ler agora!`,
            link: `/BookDetails?id=${book.id}`,
            related_id: book.id
          });

          console.log(`✅ Notificação criada para ${interest.user_email}`);

          // Enviar email
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: interest.user_email,
            subject: `📚 "${book.title}" foi lançado!`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #FF0864; text-align: center;">🎉 O livro que você esperava chegou!</h1>
                <h2 style="color: #3065DF;">${book.title}</h2>
                <p style="font-size: 16px; line-height: 1.6;">
                  Olá, ${interest.user_name || 'leitor(a)'}!
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  Temos uma ótima notícia: <strong>${book.title}</strong> de <strong>${book.author}</strong> foi lançado e já está disponível para leitura!
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  ${book.description || 'Uma história incrível te espera.'}
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('BASE_URL') || 'https://romance-no-bolso.base44.app'}/BookDetails?id=${book.id}" 
                     style="background: #FF0864; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-size: 18px; display: inline-block;">
                    Começar a Ler Agora
                  </a>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">
                  Romance no Bolso - Suas histórias favoritas, sempre à mão
                </p>
              </div>
            `
          });

          console.log(`📧 Email enviado para ${interest.user_email}`);

          // Marcar como notificado
          await base44.asServiceRole.entities.BookInterest.update(interest.id, {
            notified: true
          });

          totalNotified++;
        } catch (error) {
          console.error(`❌ Erro ao notificar ${interest.user_email}:`, error);
        }
      }
    }

    console.log(`✅ Processo concluído! ${totalNotified} notificações enviadas.`);

    return Response.json({ 
      success: true, 
      booksLaunched: booksLaunchedToday.length,
      usersNotified: totalNotified
    });

  } catch (error) {
    console.error('❌ Erro na função notifyBookLaunch:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});