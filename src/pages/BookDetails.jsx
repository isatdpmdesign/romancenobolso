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
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Cabeçalho Superior */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <ShareButton bookId={book.id} bookTitle={book.titulo} />
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate(`/ManageChapters?bookId=${bookId}`)}>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      {book.capa_url && (
        <div className="relative w-full h-[30vh] md:h-[60vh]">
            <img src={book.capa_url} alt={book.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      <div className={`max-w-3xl mx-auto px-4 md:px-6 relative z-10 ${book.capa_url ? '-mt-20 md:-mt-32' : 'mt-10'}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-10">
          <div className="p-6 md:p-8">
            <div className="flex gap-6">
              {book.capa_vertical_url && (
                <img src={book.capa_vertical_url} alt={book.titulo} className="w-24 md:w-32 rounded-lg shadow-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.titulo}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">por {book.autor}</p>
                
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-md">{book.categoria}</span>
                  {book.classificacao_indicativa && (
                    <span className="bg-gray-800 text-white text-sm font-semibold px-2 rounded-md">
                      {book.classificacao_indicativa}
                    </span>
                  )}
                  <span className="text-sm text-gray-600 font-medium">📖 {chapters.length} capítulos</span>
                </div>

                {/* SELECT DE CAPÍTULOS NO ESPAÇO CIRCULADO */}
                {chapters.length > 0 && (
                  <div className="relative w-full md:w-64 mt-4">
                    <select 
                      onChange={(e) => navigate(`/Reader?bookId=${bookId}&chapterId=${e.target.value}`)}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pl-4 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:bg-white transition-all shadow-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>Selecionar capítulo</option>
                      {chapters.map((chapter, index) => (
                        <option key={chapter.id} value={chapter.id}>
                          {index + 1}. {chapter.titulo || `Capítulo ${chapter.ordem}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleMainAction}
              className={`w-full mt-6 py-6 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] ${
                hasPurchased ? "bg-green-600 hover:bg-green-700 text-white" : "bg-[#FF0864] hover:bg-[#D10050] text-white"
              }`}
              size="lg"
            >
                {hasPurchased ? (
                    <> <CheckCircle className="w-5 h-5 mr-2" /> Continuar Lendo </>
                ) : (
                    <> <BookOpen className="w-5 h-5 mr-2" /> Começar a ler do início </>
                )}
            </Button>
          </div>

          {book.sinopse && (
            <div className="border-t border-gray-100 p-6 md:p-8 text-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Sinopse</h2>
              <p className="leading-relaxed whitespace-pre-line text-sm md:text-base">{book.sinopse}</p>
            </div>
          )}
        </motion.div>
      </div>
      <div className="h-10" />
    </div>
  );
}