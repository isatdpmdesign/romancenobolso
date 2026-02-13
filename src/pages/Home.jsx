import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Sparkles } from "lucide-react";
import BookCard from '../components/books/BookCard';
import BookCardSkeleton from '../components/books/BookCardSkeleton';
// Removido framer-motion para melhor performance - usando CSS transitions

export default function Home() {
  const { user, isAdmin } = useAuth();
  
  // Verifica se é admin de forma segura
  const isAdminUser = Boolean(user && isAdmin);
  
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || '';

  // 1. BUSCA DE CAPÍTULOS (Apenas para contar quantos capítulos cada livro tem)
  // Não bloqueia renderização: usa placeholderData para mostrar livros mesmo sem contagem
  const { data: chaptersData = [] } = useQuery({
    queryKey: ['chapters_count_simple'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('capitulos')
          .select('id, livro_id, audio_url')
          .limit(1000); // Limite para não travar com muitos capítulos
        
        if (error) {
          console.warn('⚠️ Erro ao buscar capítulos:', error);
          return [];
        }
        
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn('⚠️ Erro inesperado ao buscar capítulos:', err);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    gcTime: 15 * 60 * 1000, // Mantém em cache por 15 minutos
    placeholderData: [], // Permite renderizar mesmo sem dados ainda
    refetchOnWindowFocus: false // Não refaz query ao focar na janela
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
        return Array.isArray(data) ? data.filter(s => s.ativo !== false) : [];
      } catch (err) {
        console.warn('⚠️ Erro ao buscar seções da home:', err);
        return [];
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: [],
    refetchOnWindowFocus: false
  });

  // 2. BUSCA DE LIVROS (Simplificado - Funciona para logado e deslogado)
  const { data: books = [], isLoading, error: booksError } = useQuery({
    queryKey: ['books_home', isAdminUser],
    queryFn: async () => {
      const isLoggedIn = Boolean(user);
      const isAdminMode = isAdminUser;
      const PUBLIC_STATUSES = ['published', 'coming_soon', 'Publicado', 'Em Breve'];
      
      try {
        // Para visitantes (deslogados ou não-admin): buscar apenas published/coming_soon
        if (!isAdminMode) {
          const { data, error } = await supabase
            .from('livros')
            .select('*')
            .in('status', PUBLIC_STATUSES)
            .order('created_at', { ascending: false })
            .limit(100); // Limite para não travar com muitos livros

          if (error) {
            // Se for erro de RLS, retornar array vazio (não tentar fallback que pode ser mais lento)
            if (error.code === 'PGRST116' || error.status === 400 || error.status === 401) {
              console.warn('⚠️ [HOME] Erro de RLS - retornando vazio');
              return [];
            }
            return [];
          }
          
          return Array.isArray(data) ? data : [];
        }
        
        // Para ADMIN: buscar TODOS os livros (incluindo rascunhos)
        const { data, error } = await supabase
          .from('livros')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('❌ [HOME] Erro ao buscar livros (admin):', error);
          return [];
        }

        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('❌ [HOME] Erro inesperado:', err);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantém em cache por 10 minutos
    placeholderData: [], // Permite renderizar skeleton mesmo sem dados
    refetchOnWindowFocus: false // Não refaz query ao focar na janela
  });

  // Prepara os dados para o Card (inclui secao_home para filtro por seção)
  // Não bloqueia: usa chaptersCountByBook mesmo se ainda estiver carregando
  const processedBooks = React.useMemo(() => {
    if (!Array.isArray(books) || books.length === 0) return [];
    const safeChaptersCount = chaptersCountByBook || {};
    return books.map(b => ({
        id: b.id,
        title: b.titulo || 'Sem título',
        author: b.autor || 'Autor desconhecido',
        description: b.sinopse || '',
        category: b.categoria || '',
        cover_image: b.capa_vertical_url || b.capa_url || '',
        status: b.status || 'published',
        data_lancamento: b.data_lancamento,
        total_chapters: safeChaptersCount[b.id] || 0,
        secao_home: b.secao_home || null,
        classificacao: b.classificacao || null,
        age_rating: b.classificacao || b.age_rating || null,
        serie_em_andamento: b.serie_em_andamento ?? false,
        proximo_capitulo_em: b.proximo_capitulo_em || null,
        cronograma_texto: b.cronograma_texto || null
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
          <p
            role="text"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-full bg-gray-100/70 text-gray-700 border border-transparent cursor-default select-none"
            aria-label="Sua Livraria de Romances. Descubra seu próximo romance."
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF0864]" />
            <span className="text-xs sm:text-sm font-semibold text-[#1a1a1a]">Sua Livraria de Romances</span>
            <span className="text-gray-400 text-xs sm:text-sm font-normal hidden xs:inline">•</span>
            <span className="text-xs sm:text-sm font-normal text-gray-600 hidden sm:inline">Descubra seu próximo romance</span>
          </p>
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
                    {filteredBooks.map((book) => (
                        <div key={book.id}>
                            <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} isAdmin={isAdminUser} />
                        </div>
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
              const ongoingSeries = Array.isArray(processedBooks) ? processedBooks.filter(
                b => b && b.serie_em_andamento && (b.proximo_capitulo_em || b.cronograma_texto)
              ) : [];
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
                        <span className="truncate max-w-[180px] sm:max-w-none">{book.title || book.titulo}</span>
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
                     <div>
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
                     </div>
                   );
                 }
                 return sectionsWithBooks.map(({ section, books: sectionBooks }) => (
                   <div key={section.id}>
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
                   </div>
                 ));
               })()
            ) : (
               /* Fallback: sem seções configuradas — uma única bloco "Adicionados Recentemente" */
               <div>
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
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}