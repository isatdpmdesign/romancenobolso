// ============================================
// SCRIPT DE DIAGNÓSTICO - Execute no Console do Navegador
// ============================================
// Cole este código no Console do navegador (F12) e pressione Enter

(async function diagnostico() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE LIVROS...\n');
  
  // Importar supabase (ajuste o caminho se necessário)
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  
  // Você precisa colar suas credenciais aqui:
  const SUPABASE_URL = 'SUA_URL_DO_SUPABASE'; // Ex: 'https://xxxxx.supabase.co'
  const SUPABASE_ANON_KEY = 'SUA_ANON_KEY'; // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('1️⃣ Testando acesso básico à tabela livros...');
  const { data: test1, error: error1 } = await supabase
    .from('livros')
    .select('id, titulo, status')
    .limit(1);
  
  if (error1) {
    console.error('❌ ERRO no teste básico:', error1);
    console.error('   Código:', error1.code);
    console.error('   Mensagem:', error1.message);
    console.error('   Status:', error1.status);
    if (error1.code === 'PGRST116' || error1.status === 400) {
      console.error('\n🚨 PROBLEMA: RLS está bloqueando o acesso!');
      console.error('💡 SOLUÇÃO: Execute o arquivo supabase_rls_livros.sql no Supabase SQL Editor');
    }
  } else {
    console.log('✅ Acesso básico OK');
    console.log('   Dados retornados:', test1);
  }
  
  console.log('\n2️⃣ Testando busca com filtro de status...');
  const { data: test2, error: error2 } = await supabase
    .from('livros')
    .select('id, titulo, status')
    .in('status', ['published', 'coming_soon']);
  
  if (error2) {
    console.error('❌ ERRO no teste com filtro:', error2);
  } else {
    console.log('✅ Filtro de status OK');
    console.log(`   Livros encontrados: ${test2?.length || 0}`);
    if (test2 && test2.length > 0) {
      console.log('   Primeiros livros:', test2.slice(0, 3));
    } else {
      console.warn('   ⚠️ Nenhum livro com status "published" ou "coming_soon" encontrado!');
      console.warn('   💡 Verifique no Admin se os livros têm o status correto');
    }
  }
  
  console.log('\n3️⃣ Testando busca SEM filtro (todos os status)...');
  const { data: test3, error: error3 } = await supabase
    .from('livros')
    .select('id, titulo, status')
    .limit(10);
  
  if (error3) {
    console.error('❌ ERRO ao buscar todos:', error3);
  } else {
    console.log('✅ Busca sem filtro OK');
    console.log(`   Total de livros (primeiros 10): ${test3?.length || 0}`);
    if (test3 && test3.length > 0) {
      console.log('   Status dos livros:', test3.map(l => ({ titulo: l.titulo, status: l.status })));
    } else {
      console.warn('   ⚠️ Nenhum livro encontrado no banco!');
      console.warn('   💡 Certifique-se de que há livros cadastrados no Admin');
    }
  }
  
  console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
})();
