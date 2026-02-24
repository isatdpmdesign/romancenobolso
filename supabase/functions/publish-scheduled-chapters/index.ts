/**
 * Supabase Edge Function: publish-scheduled-chapters
 * Chamada por um cron externo (ex: a cada 5 min). Publica capítulos com
 * agendado_para <= now() e envia notificações aos usuários.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    // 1. Capítulos agendados cujo horário já passou e ainda não foram publicados
    const { data: chaptersToPublish, error: fetchErr } = await supabase
      .from('capitulos')
      .select('id, livro_id, titulo, ordem')
      .not('agendado_para', 'is', null)
      .lte('agendado_para', now)
      .is('publicado_em', null);

    if (fetchErr) {
      console.error('Erro ao buscar capítulos agendados:', fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!chaptersToPublish?.length) {
      return new Response(JSON.stringify({ ok: true, published: 0, message: 'Nenhum capítulo para publicar' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const published: { chapterId: string; bookTitle: string; notifications: number }[] = [];

    for (const ch of chaptersToPublish) {
      // 2. Marcar capítulo como publicado
      const { error: updateErr } = await supabase
        .from('capitulos')
        .update({ publicado_em: now })
        .eq('id', ch.id);

      if (updateErr) {
        console.error(`Erro ao publicar capítulo ${ch.id}:`, updateErr);
        continue;
      }

      // 3. Buscar título do livro
      const { data: book } = await supabase.from('livros').select('titulo').eq('id', ch.livro_id).single();
      const bookTitle = book?.titulo || 'Livro';

      // 4. Coletar emails para notificação (mesma lógica do Admin: book_interest, comment, minha_estante, notification)
      const emails = new Set<string>();

      const tables = [
        { table: 'book_interest', column: 'user_email' },
        { table: 'comment', column: 'user_email' },
        { table: 'minha_estante', column: 'user_email' },
        { table: 'notification', column: 'user_email' }
      ] as const;

      for (const { table, column } of tables) {
        const { data: rows } = await supabase.from(table).select(column).limit(2000);
        rows?.forEach((r: Record<string, string>) => { if (r[column]) emails.add(r[column]); });
      }

      const link = `/Reader?bookId=${ch.livro_id}&chapterId=${ch.id}`;
      const notifications = Array.from(emails).map((user_email) => ({
        user_email,
        type: 'new_chapter',
        title: `📖 Novo capítulo: ${bookTitle}`,
        message: `"${ch.titulo || `Capítulo ${ch.ordem}`}" acaba de ser publicado.`,
        link,
        related_id: ch.id
      }));

      if (notifications.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
          const batch = notifications.slice(i, i + batchSize);
          await supabase.from('notification').insert(batch);
        }
      }

      published.push({ chapterId: ch.id, bookTitle, notifications: notifications.length });
    }

    return new Response(JSON.stringify({ ok: true, published: published.length, details: published }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
