# Romance no Bolso: próximos passos do site

Anotado em 21/11/2026. Ainda não executado: a Isadora pediu para mexer no site depois.

## Mudança de posicionamento

O Romance no Bolso começou como **plataforma/livraria de livros** (é o que este código faz hoje: catálogo, leitor, login, pagamento, painel admin).

O novo papel:

- **Romance no Bolso = editora.** Publica os romances da Dora Mendes e **produz os audiolivros** (ex.: *O Afilhado*, Quinlogia Os Russels, no Spotify e no YouTube).
- **Serviço freela:** transformar o livro de outros autores em audiolivro.
- **Openbooks (futuro):** a ferramenta de produzir livros vai virar um produto separado, chamado Openbooks. A parte de plataforma deste repositório provavelmente migra para lá.

## Problema que está no ar hoje

Quem abre romancenobolso.com.br vê "Sua Livraria de Romances", a mensagem "Nenhum livro disponível no momento." e um aviso técnico para o programador:

> Certifique-se de que há livros com status 'published' ou 'coming_soon' no banco.

Esse aviso está em `src/pages/Home.jsx`, linhas 264–265. Ele não deveria aparecer para o público. Junto com a livraria vazia, passa a impressão de projeto abandonado.

**Enquanto isso:** a página de links da Dora (@dora.escreve) deixa o botão "Romance no Bolso" como "em breve" e não aponta para o site até ele refletir a editora.

## Proposta para a nova página inicial

Uma página simples de editora, no lugar da livraria:

1. **O que é:** "Editora de romances que produz audiolivros."
2. **Catálogo:** *O Afilhado*, com capa, sinopse curta e botões do Spotify e do YouTube. Depois, os próximos livros da quinlogia.
3. **Serviço:** "Transformo o seu livro em audiolivro". Amostras de narração, como funciona e um contato.
4. **Openbooks:** uma seção "em breve" ou uma página separada, quando existir.
5. **Identidade:** a mesma da página de links: logo Romance no Bolso (rosa `#FF0864` e azul `#3065DF`), estilo adesivo e colagem de papel.

## Antes de mexer no código

- Ler o código atual (é um app Vite + React com Supabase, login e pagamento) e decidir com a Isadora:
  - **Trocar só a página inicial** e manter a plataforma escondida até ela virar o Openbooks (recomendado: menor risco, nada se perde), **ou**
  - Separar de vez: o site da editora fica aqui e a plataforma vai para um repositório Openbooks.
- Confirmar o que o botão "Baixar app" do topo faz hoje e se ele continua.
- Quando a nova página inicial estiver no ar, trocar o botão "em breve" da página de links por `https://romancenobolso.com.br`.
