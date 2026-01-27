import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Sparkles, Flame, Star, Search } from "lucide-react";
import BookCard from '../components/books/BookCard';
import BookCardSkeleton from '../components/books/BookCardSkeleton';
import { motion } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();
  
  // Captura busca da URL (?search=...)
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || '';

  // 1. BUSCAR LIVROS (Lista Geral)
  const { data: books = [], isLoading: isLoadingBooks } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livros')
        .select('*')
        .neq('status', 'draft') // Apenas publicados
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Adaptamos para o formato que o BookCard espera
      return data.map(b => ({
        id: b.id,
        title: b.titulo,
        author: b.autor,
        description: b.sinopse,
        category: b.categoria,
        cover_image: b.capa_vertical_url,
        cover_image_hero: b.capa_url,
        status: b.status,
        publish_date: b.created_at,
        link_stripe: b.link_stripe
      }));
    }
  });

  // 2. BUSCAR CAPÍTULOS (Para saber quais têm áudio)
  const { data: chaptersData = [] } = useQuery({
    queryKey: ['chapters_meta'],
    queryFn: async () => {
      const { data } = await supabase.from('capitulos').select('id, livro_id, audio_url');
      return data || [];
    }
  });

  // Cria um conjunto de IDs de livros que têm áudio
  const booksWithAudio = new Set(
    chaptersData.filter(c => c.audio_url && c.audio_url.length > 5).map(c => c.livro_id)
  );

  // --- FILTROS ---
  const filteredBooks = books.filter(book => {
    const term = searchQuery.toLowerCase();
    return book.title.toLowerCase().includes(term) || book.author.toLowerCase().includes(term);
  });

  // Separa as listas
  const newBooks = [...books].slice(0, 10); // 10 mais recentes
  const popularBooks = [...books].sort(() => Math.random() - 0.5).slice(0, 10); // Aleatório (Simulação)
  const recommendedBooks = [...books].filter(b => b.category === 'Romance').slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-[#E8EEFB] dark:from-gray-900 dark:to-gray-800 pb-20">
      
      {/* Cabeçalho Simples de Boas Vindas */}
      {!searchQuery && (
        <div className="pt-10 px-6 max-w-7xl mx-auto">
           <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
             Olá, {user?.user_metadata?.name || 'Leitor(a)'} 👋
           </h1>
           <p className="text-gray-500 text-lg">Qual história vamos ler hoje?</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {searchQuery ? (
          /* TELA DE BUSCA */
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Search className="w-6 h-6" /> Resultados para "{searchQuery}"
            </h2>
            {isLoadingBooks ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => <BookCardSkeleton key={i} />)}
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {filteredBooks.map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} />
                    </motion.div>
                  ))}
                </div>
            ) : (
              <div className="text-center py-20 bg-white/50 rounded-3xl">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum livro encontrado com esse nome.</p>
              </div>
            )}
          </div>
        ) : (
          /* LISTAGEM NORMAL (Sem Banner) */
          <div className="space-y-12">
            
            {/* Seção 1: Novidades */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#FF0864]" /> Adicionados Recentemente
                </h2>
              </div>
              
              {isLoadingBooks ? (
                 <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                    {[...Array(4)].map((_, i) => <div key={i} className="w-[160px] flex-shrink-0"><BookCardSkeleton /></div>)}
                 </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-6 md:overflow-visible">
                  {newBooks.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-auto snap-start">
                      <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Seção 2: Populares */}
            {popularBooks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" /> Em Alta
                  </h2>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-6 md:overflow-visible">
                  {popularBooks.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-auto snap-start">
                      <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Seção 3: Romances (Exemplo) */}
            {recommendedBooks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="w-6 h-6 text-purple-500" /> Romances Imperdíveis
                  </h2>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-6 md:overflow-visible">
                  {recommendedBooks.map((book) => (
                    <div key={book.id} className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-auto snap-start">
                      <BookCard book={book} hasAudio={booksWithAudio.has(book.id)} />
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