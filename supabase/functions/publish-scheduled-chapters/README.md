# Publicar capítulos agendados

Esta Edge Function publica capítulos cujo `agendado_para` já passou e envia notificações aos usuários.

## Deploy

No projeto Supabase (CLI ou Dashboard):

```bash
supabase functions deploy publish-scheduled-chapters
```

## Chamar via Cron

Para que os capítulos sejam publicados no horário agendado, chame esta função a cada **5 a 15 minutos**.

### URL da função

```
https://<SEU_PROJECT_REF>.supabase.co/functions/v1/publish-scheduled-chapters
```

Use o método **POST** e inclua o header:

```
Authorization: Bearer <SUPABASE_ANON_KEY>
```

(ou a service role key se precisar; anon costuma bastar se a função não depender de RLS na leitura.)

### Exemplos de cron externo

1. **cron-job.org** (grátis): crie um job que faz POST para essa URL a cada 5 ou 15 minutos.
2. **Vercel Cron** (se o site estiver na Vercel): em `vercel.json`:
   ```json
   {
     "crons": [{ "path": "/api/publish-chapters", "schedule": "*/15 * * * *" }]
   }
   ```
   e crie uma API Route que faz `fetch` para a URL da Edge Function acima.
3. **GitHub Actions**: workflow que roda a cada 15 min e faz `curl -X POST ...` na URL da função.

Depois de configurar o cron, os capítulos marcados como "Agendar publicação" no Admin serão publicados no horário e os usuários receberão a notificação em **Notificações**.
