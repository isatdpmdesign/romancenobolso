import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Heart, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function MyBooks() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Busca o progresso de leitura
  const { data: progressData = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // 2. Busca detalhes dos livros (Priorizando Capa Vertical)
  const { data: booksWithProgress = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['myBooksWithProgress', progressData],
    queryFn: async () => {
      if (!progressData || progressData.length === 0) return [];
      const bookIds = progressData.map(p => p.book_id);
      const { data: booksData, error: booksError } = await supabase
        .from('livros')
        .select('id, titulo, autor, capa_url, capa_vertical_url')
        .in('id', bookIds);
      if (booksError) throw booksError;
      return progressData.map(progress => {
        const book = booksData?.find(b => b.id === progress.book_id);
        return { 
          ...book, 
          progressPercent: progress.progress_percent, 
          lastChapterId: progress.last_chapter_id 
        };
      }).filter(item => item.id);
    },
    enabled: progressData.length > 0
  });

  const books = booksWithProgress;
  const loading = loadingProgress || loadingBooks;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0864]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8FA] p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho com tipografia ajustada */}
        <div className="mb-6 sm:mb-8 md:mb-10 flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-1.5 sm:p-2 hover:bg-[#FFE5EE] active:bg-[#FFE5EE] text-[#FF0864] rounded-full transition-all touch-manipulation active:scale-95"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1a1a1a] tracking-tight">Minha Estante</h1>
        </div>

        {books.length === 0 ? (
          /* Estado Vazio - Tipografia Leve */
          <div className="max-w-2xl mx-auto mt-6 sm:mt-10 text-center py-12 sm:py-16 md:py-20 px-6 sm:px-8 md:px-10 bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-sm border border-pink-50">
            <div className="relative inline-block mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-[#FFE5EE] rounded-full blur-2xl opacity-60"></div>
              <div className="relative bg-[#FFF8FA] p-6 sm:p-8 md:p-10 rounded-full text-[#FF0864]">
                <Heart size={48} className="sm:w-16 sm:h-16 md:w-[64px] md:h-[64px]" strokeWidth={1} />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 px-2">Sua estante aguarda...</h2>
            <p className="text-gray-500 mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg font-normal leading-relaxed px-2">
              Você ainda não começou nenhum romance. <br className="hidden sm:block"/>Que tal se apaixonar por um novo capítulo hoje?
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-[#FF0864] hover:bg-[#D10050] active:bg-[#D10050] text-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg shadow-lg shadow-pink-100 transition-all active:scale-95 touch-manipulation"
            >
              EXPLORAR LIVROS
            </Button>
          </div>
        ) : (
          /* Grid de Livros com Tipografia Refinada */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-2xl sm:rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-xl active:shadow-xl transition-all duration-300 group">
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img 
                    src={book.capa_vertical_url || book.capa_url} 
                    alt={book.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 backdrop-blur text-[#3065DF] text-[9px] sm:text-[10px] font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
                    {book.progressPercent}%
                  </div>
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-grow">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-1 mb-1">{book.titulo}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider mb-3 sm:mb-4">{book.autor || 'Romance no Bolso'}</p>
                  
                  <div className="mt-auto">
                    {/* Barra de Progresso Sutil */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] sm:text-[10px] font-medium uppercase text-gray-400">Progresso</span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-[#3065DF]">{book.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1 mb-4 sm:mb-6">
                      <div 
                        className="bg-[#3065DF] h-1 rounded-full transition-all duration-1000" 
                        style={{ width: `${book.progressPercent}%` }}
                      ></div>
                    </div>

                    <Button 
                      onClick={() => navigate(book.lastChapterId ? `/Reader?bookId=${book.id}&chapterId=${book.lastChapterId}` : `/BookDetails?id=${book.id}`)}
                      className="w-full bg-[#FF0864] hover:bg-[#D10050] active:bg-[#D10050] text-white font-semibold py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 touch-manipulation text-xs sm:text-sm"
                    >
                      CONTINUAR LENDO <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}