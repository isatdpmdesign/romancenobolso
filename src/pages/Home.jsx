import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Sparkles } from "lucide-react";
import BookCard from '../components/books/BookCard';
import BookCardSkeleton from '../components/books/BookCardSkeleton';
import { motion } from 'framer-motion';

export default function Home() {
  const { user, isAdmin } = useAuth();
  
  // Verifica se é admin de forma segura
  const isAdminUser = Boolean(user && isAdmin);
  
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || '';

  // 1. BUSCA DE CAPÍTULOS (Apenas para contar quantos capítulos cada livro tem)
  const { data: chaptersData = [] } = useQuery({
    queryKey: ['chapters_count_simple'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('capitulos')
          .select('id, livro_id, audio_url');
        
        if (error) {
          console.warn('⚠️ Erro ao buscar capítulos:', error);
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.warn('⚠️ Erro inesperado ao buscar capítulos:', err);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000 // Cache por 5 minutos
  });

  // Mapa de contagem de capítulos
  const chaptersCountByBook = React.useMemo(() => {
    const count = {};
    chaptersData.forEach(chapter => {
      count[chapter.livro_id] = (count[chapter.livro_id] || 0) + 1;
    });
    return count;
  }, [chaptersData]);

  // Identifica quais livros têm áudio
  const booksWithAudio = React.useMemo(() => {
    return new Set(chaptersData.filter(c => c.audio_url && c.audio_url.length > 5).map(c => c.livro_id));
  }, [chaptersData]);

  // Seções da home (Organizar Home)
  const { data: homeSections = [] } = useQuery({
    queryKey: ['home_sections'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('home_sections')
          .select('*')
          .order('ordem', { ascending: true });
        if (error) throw error;
        return (data || []).filter(s => s.ativo !== false);
      } catch (err) {
        console.warn('⚠️ Erro ao buscar seções da home:', err);
        return [];
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000
  });

  // 2. BUSCA DE LIVROS (Simplificado - Funciona para logado e deslogado)
  const { data: books = [], isLoading, error: booksError } = useQuery({
    queryKey: ['books_home', isAdminUser],
    queryFn: async () => {
      const isLoggedIn = Boolean(user);
      const isAdminMode = isAdminUser;
      const PUBLIC_STATUSES = ['published', 'coming_soon', 'Publicado', 'Em Breve'];
      
      console.log("🔍 [HOME] Buscando livros...", { 
        isLoggedIn, 
        isAdmin: isAdminMode,
        userId: user?.id || 'deslogado'
      });

      try {
        // ESTRATÉGIA: Tentar buscar com filtro primeiro, se falhar, tentar sem filtro
        
        // Para visitantes (deslogados ou não-admin): buscar apenas published/coming_soon
        if (!isAdminMode) {
          console.log("👤 [HOME] Modo VISITANTE: filtrando por status publicado/em breve");
          
          const { data, error } = await supabase
            .from('livros')
            .select('*')
            .in('status', PUBLIC_STATUSES)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ [HOME] Erro ao buscar livros (com filtro):', error);
            console.error('   Código:', error.code, '| Status:', error.status);
            
            // Se for erro de RLS, tentar buscar sem filtro como fallback
            if (error.code === 'PGRST116' || error.status === 400 || error.status === 401) {
              console.warn('⚠️ [HOME] Erro de RLS detectado. Tentando buscar sem filtro...');
              
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('livros')
                .select('id, titulo, status')
                .limit(10);
              
              if (fallbackError) {
                console.error('❌ [HOME] Erro também no fallback:', fallbackError);
                console.error('🚨 [HOME] PROBLEMA DE RLS! Execute supabase_rls_livros.sql');
                return [];
              }
              
              // Filtrar manualmente no cliente
              const filtered = (fallbackData || []).filter(b => {
                const status = (b.status || '').toLowerCase();
                return status === 'published' || status === 'coming_soon' || status === 'publicado' || status === 'em breve';
              });
              
              console.log(`✅ [HOME] Fallback: ${filtered.length} livros encontrados`);
              return filtered;
            }
            
            return [];
          }

          console.log(`✅ [HOME] Visitante: ${data?.length || 0} livros encontrados`);
          if (data && data.length > 0) {
            console.log('📚 [HOME] Livros:', data.slice(0, 3).map(b => ({ titulo: b.titulo, status: b.status })));
          } else {
            console.warn('⚠️ [HOME] Nenhum livro com status publicado/em breve encontrado!');
          }
          
          return data || [];
        }
        
        // Para ADMIN: buscar TODOS os livros (incluindo rascunhos)
        console.log("👤 [HOME] Modo ADMIN: buscando TODOS os livros");
        
        const { data, error } = await supabase
          .from('livros')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ [HOME] Erro ao buscar livros (admin):', error);
          console.error('   Código:', error.code, '| Status:', error.status);
          return [];
        }

        console.log(`✅ [HOME] Admin: ${data?.length || 0} livros encontrados`);
        if (data && data.length > 0) {
          console.log('📚 [HOME] Todos os livros:', data.slice(0, 5).map(b => ({ titulo: b.titulo, status: b.status })));
        } else {
          console.warn('⚠️ [HOME] Nenhum livro encontrado no banco!');
        }

        return data || [];
      } catch (err) {
        console.error('❌ [HOME] Erro inesperado:', err);
        return [];
      }
    },
    enabled: true, // Roda sempre
    retry: 1,
    staleTime: 2 * 60 * 1000
  });

  // Prepara os dados para o Card (inclui secao_home para filtro por seção)
  const processedBooks = React.useMemo(() => {
    return books.map(b => ({
        id: b.id,
        title: b.titulo || 'Sem título',
        author: b.autor || 'Autor desconhecido',
        description: b.sinopse || '',
        category: b.categoria || '',
        cover_image: b.capa_vertical_url || b.capa_url || '',
        status: b.status || 'published',
        data_lancamento: b.data_lancamento,
        total_chapters: chaptersCountByBook[b.id] || 0,
        secao_home: b.secao_home || null,
        classificacao: b.classificacao || null,
        age_rating: b.classificacao || b.age_rating || null
    }));
  }, [books, chaptersCountByBook]);

  // Filtro de busca (barra de pesquisa)
  const filteredBooks = React.useMemo(() => {
    if (!searchQuery) return processedBooks;
    const term = searchQuery.toLowerCase();
    return processedBooks.filter(b => 
        (b.title || '').toLowerCase().includes(term) || 
        (b.author || '').toLowerCase().includes(term)
    );
  }, [processedBooks, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFF8FA] pb-20">
      
      {/* Cabeçalho */}
      {!searchQuery && (
        <div className="pt-6 sm:pt-8 md:pt-10 px-4 sm:px-6 max-w-7xl mx-auto flex justify-start items-start flex-wrap">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-full bg-white/80 backdrop-blur border border-gray-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF0864]" />
            <span className="text-xs sm:text-sm font-semibold text-[#1a1a1a]">Sua Livraria de Romances</span>
            <span className="text-gray-300 text-xs sm:text-sm font-normal hidden xs:inline">•</span>
            <span className="text-xs sm:text-sm font-normal text-gray-900 hidden sm:inline">Descubra seu próximo romance</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {searchQuery ? (
          /* TELA DE BUSCA */
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1a1a1a] mb-4 sm:mb-6 flex items-center gap-2 px-1">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#3065DF]" /> <span>Resultados para "{searchQuery}"</span>
            </h2>
            {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                    {filteredBooks.map((book, i) => (
                        <motion.div key={book.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                            <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} isAdmin={isAdminUser} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
                    <p className="text-gray-400">Nenhum livro encontrado.</p>
                </div>
            )}
          </div>
        ) : (
          /* LISTAGEM POR SEÇÕES DA HOME */
          <div className="space-y-12">
            {(() => {
              const ongoingSeries = (processedBooks || []).filter(
                b => b.serie_em_andamento && (b.proximo_capitulo_em || b.cronograma_texto)
              );
              if (ongoingSeries.length === 0) return null;
              return (
                <div className="rounded-2xl bg-gradient-to-r from-[#3065DF]/10 to-[#FF0864]/10 border border-[#3065DF]/20 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#3065DF] mb-2">📖 Novos capítulos em breve</p>
                  <div className="flex flex-wrap gap-3">
                    {ongoingSeries.map(book => (
                      <Link
                        key={book.id}
                        to={createPageUrl('BookDetails') + `?id=${book.id}`}
                        className="inline-flex items-center gap-2 bg-white/80 hover:bg-white rounded-xl px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors"
                      >
                        <span className="truncate max-w-[180px] sm:max-w-none">{book.titulo}</span>
                        {book.proximo_capitulo_em && (
                          <span className="text-xs text-gray-500 shrink-0">
                            {new Date(book.proximo_capitulo_em + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        {book.cronograma_texto && !book.proximo_capitulo_em && (
                          <span className="text-xs text-gray-500 shrink-0">{book.cronograma_texto}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
            {isLoading ? (
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                  {[...Array(5)].map((_, i) => <BookCardSkeleton key={i} />)}
               </div>
            ) : booksError ? (
               <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
                  <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Erro ao carregar livros.</p>
                  <p className="text-gray-400 text-sm mt-2">Verifique o console para mais detalhes.</p>
               </div>
            ) : processedBooks.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
                  <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum livro disponível no momento.</p>
                  <p className="text-gray-400 text-sm mt-2">Certifique-se de que há livros com status 'published' ou 'coming_soon' no banco.</p>
               </div>
            ) : homeSections.length > 0 ? (
               /* Renderiza só seções que têm livros; ordem mantida. Se nenhuma tiver, fallback "Adicionados Recentemente". */
               (() => {
                 const sectionsWithBooks = homeSections
                   .map(s => ({ section: s, books: processedBooks.filter(b => (b.secao_home || '') === (s.nome || '')) }))
                   .filter(({ books }) => books.length > 0);
                 if (sectionsWithBooks.length === 0) {
                   return (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                       <div className="flex items-center mb-6 gap-2">
                         <Sparkles className="w-6 h-6 text-[#3065DF]" />
                         <h2 className="text-2xl font-semibold text-[#1a1a1a]">Adicionados Recentemente</h2>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-8 md:gap-y-10">
                         {processedBooks.map(book => (
                           <div key={book.id}>
                             <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} isAdmin={isAdminUser} />
                           </div>
                         ))}
                       </div>
                     </motion.div>
                   );
                 }
                 return sectionsWithBooks.map(({ section, books: sectionBooks }, i) => (
                   <motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                     <div className="flex items-center mb-6 gap-2">
                       <Sparkles className="w-6 h-6 text-[#3065DF]" />
                       <h2 className="text-2xl font-semibold text-[#1a1a1a]">{section.nome}</h2>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-8 md:gap-y-10">
                       {sectionBooks.map(book => (
                         <div key={book.id}>
                           <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} isAdmin={isAdminUser} />
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 ));
               })()
            ) : (
               /* Fallback: sem seções configuradas — uma única bloco "Adicionados Recentemente" */
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center mb-6 gap-2">
                        <Sparkles className="w-6 h-6 text-[#3065DF]" />
                        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Adicionados Recentemente</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-8 md:gap-y-10">
                        {processedBooks.map(book => (
                            <div key={book.id}>
                                <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} isAdmin={isAdminUser} />
                            </div>
                        ))}
                    </div>
               </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}