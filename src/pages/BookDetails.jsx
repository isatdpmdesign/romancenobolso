import React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BookOpen, 
  Edit, 
  CheckCircle, 
  ChevronDown 
} from "lucide-react";
import ShareButton from '../components/books/ShareButton';
import { motion } from 'framer-motion';

export default function BookDetails() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  // 1. BUSCAR LIVRO
  const { data: book, isLoading: loadingBook } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from('livros').select('*').eq('id', bookId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId
  });

  // 2. BUSCAR CAPÍTULOS
  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', bookId],
    queryFn: async () => {
      const { data } = await supabase
        .from('capitulos')
        .select('id, ordem, titulo')
        .eq('livro_id', bookId)
        .order('ordem', { ascending: true });
      return data || [];
    },
    enabled: !!bookId
  });

  // 3. VERIFICAR SE JÁ COMPROU
  const { data: purchase } = useQuery({
    queryKey: ['hasPurchased', bookId, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.email)
        .eq('book_id', bookId)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email && !!bookId
  });

  const hasPurchased = !!purchase;

  const handleMainAction = () => {
    if (chapters.length > 0) {
        navigate(`/Reader?bookId=${bookId}&chapterId=${chapters[0].id}`);
    } else {
        alert("Livro sem capítulos cadastrados.");
    }
  };

  if (loadingBook || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#3065DF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Cabeçalho Superior */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="h-8 sm:h-9 text-xs sm:text-sm touch-manipulation">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> <span className="hidden xs:inline">Voltar</span>
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShareButton bookId={book.id} bookTitle={book.titulo} />
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate(`/ManageChapters?bookId=${bookId}`)} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation">
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {book.capa_url && (
        <div className="relative w-full h-[25vh] sm:h-[30vh] md:h-[60vh]">
            <img src={book.capa_url} alt={book.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      <div className={`max-w-3xl mx-auto px-3 sm:px-4 md:px-6 relative z-10 ${book.capa_url ? '-mt-16 sm:-mt-20 md:-mt-32' : 'mt-6 sm:mt-10'}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden mb-6 sm:mb-10">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-row gap-3 sm:gap-4 md:gap-6">
              
              {/* --- TRAVA DE SEGURANÇA DA IMAGEM --- */}
              {book.capa_vertical_url && (
                <div className="relative w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 lg:w-32 lg:h-48 aspect-[2/3] rounded-lg shadow-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                  <img 
                    src={book.capa_vertical_url} 
                    alt={book.titulo} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                </div>
              )}
              {/* --- FIM DA TRAVA --- */}

              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white leading-tight">{book.titulo}</h1>
                </div>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-3">por {book.autor}</p>
                
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-4">
                  <span className="bg-gray-100 text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md font-normal">{book.categoria}</span>
                  <span className="text-xs sm:text-sm text-gray-600 font-normal">📖 {chapters.length} capítulos</span>
                  {book.classificacao && (
                    <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-white shadow-sm ${
                      book.classificacao === 'Livre' ? 'bg-green-500' :
                      book.classificacao === '+10' || book.classificacao === '10+' ? 'bg-blue-500' :
                      book.classificacao === '+12' || book.classificacao === '12+' ? 'bg-yellow-500' :
                      book.classificacao === '+14' || book.classificacao === '14+' ? 'bg-orange-500' :
                      book.classificacao === '+16' || book.classificacao === '16+' ? 'bg-red-500' :
                      book.classificacao === '+18' || book.classificacao === '18+' ? 'bg-gray-900' :
                      'bg-gray-600'
                    }`}>
                      {book.classificacao}
                    </span>
                  )}
                </div>

                {/* SELECT DE CAPÍTULOS */}
                {chapters.length > 0 && (
                  <div className="relative w-full sm:w-64 mt-4">
                    <select 
                      onChange={(e) => navigate(`/Reader?bookId=${bookId}&chapterId=${e.target.value}`)}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:bg-white transition-all shadow-sm touch-manipulation"
                      defaultValue=""
                    >
                      <option value="" disabled>Capítulos</option>
                      {chapters.map((chapter, index) => (
                        <option key={chapter.id} value={chapter.id}>
                          {index + 1}. {chapter.titulo || `Capítulo ${chapter.ordem}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleMainAction}
              className={`w-full mt-4 sm:mt-6 py-4 sm:py-5 md:py-6 text-sm sm:text-base md:text-lg font-semibold shadow-lg transition-all active:scale-[0.98] touch-manipulation ${
                hasPurchased ? "bg-green-600 hover:bg-green-700 active:bg-green-700 text-white" : "bg-[#FF0864] hover:bg-[#D10050] active:bg-[#D10050] text-white"
              }`}
              size="lg"
            >
                {hasPurchased ? (
                    <> <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> <span>Continuar Lendo</span> </>
                ) : (
                    <> <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> <span>Começar a ler do início</span> </>
                )}
            </Button>
          </div>

          {book.sinopse && (
            <div className="border-t border-gray-100 p-4 sm:p-6 md:p-8 text-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Sinopse</h2>
              <p className="leading-relaxed whitespace-pre-line text-sm" style={{ fontSize: '14px' }}>{book.sinopse}</p>
            </div>
          )}
        </motion.div>
      </div>
      <div className="h-10" />
    </div>
  );
}