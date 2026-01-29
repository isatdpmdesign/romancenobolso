import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShoppingCart, List, ChevronRight, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react"; 
import ReactMarkdown from 'react-markdown';
import ReaderControls from '../components/reader/ReaderControls';
import ReaderSettings from '../components/reader/ReaderSettings';
import ShareButton from '../components/books/ShareButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AudioPlayer from '../components/reader/AudioPlayer';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const THEMES = {
  light: { bg: '#FFFFFF', text: '#1a1a1a', ui: '#f8f9fd', buttonBg: '#E8EEFB', hover: '#D1DDF5' },
  sepia: { bg: '#F4ECD8', text: '#5c4b37', ui: '#e8dec7', buttonBg: '#E9E0C9', hover: '#DCCFB4' },
  dark: { bg: '#121212', text: '#e5e5e5', ui: '#1e1e1e', buttonBg: '#2d2d2d', hover: '#3d3d3d' },
};

const FONTS = { serif: 'Georgia, serif', sans: 'system-ui, sans-serif', mono: 'ui-monospace, monospace' };
const DEFAULT_SETTINGS = { fontSize: 18, theme: 'light', fontFamily: 'serif', lineHeight: 1.8 };

export default function Reader() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [showChapters, setShowChapters] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(true);
  const queryClient = useQueryClient();
  const [readerSettings, setReaderSettings] = useState(() => {
    const saved = localStorage.getItem('readerSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('bookId');
  const chapterId = urlParams.get('chapterId');

  const currentTheme = THEMES[readerSettings.theme] || THEMES.light;
  const currentFont = FONTS[readerSettings.fontFamily] || FONTS.serif;

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const { data } = await supabase.from('livros').select('*').eq('id', bookId).single();
      return data;
    },
    enabled: !!bookId
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', bookId],
    queryFn: async () => {
      const { data } = await supabase.from('capitulos').select('id, titulo, ordem, is_gratuito').eq('livro_id', bookId).order('ordem', { ascending: true });
      return data;
    },
    enabled: !!bookId
  });

  const { data: chapter, isLoading: loadingChapter } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      const { data } = await supabase.from('capitulos').select('*').eq('id', chapterId).single();
      return data;
    },
    enabled: !!chapterId
  });

  // Verificar se o capítulo atual está marcado
  const { data: userProgress, isLoading: loadingUserProgress } = useQuery({
    queryKey: ['userProgress', user?.id, bookId],
    queryFn: async () => {
      if (!user?.id || !bookId) return null;
      const { data } = await supabase
        .from('user_progress')
        .select('last_chapter_id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!bookId
  });

  const isChapterMarked = userProgress?.last_chapter_id === chapterId && !!user;
  const hasAutoRegisteredRef = useRef(false);

  useEffect(() => {
    hasAutoRegisteredRef.current = false;
  }, [bookId]);

  // Registrar livro em "Minha Estante" assim que o usuário logado começa a ler (sem progresso prévio).
  // O botão Salvar/marcar capítulo continua com a mesma regra (handleBookmark).
  useEffect(() => {
    if (
      !user?.id ||
      !bookId ||
      !chapterId ||
      !chapter ||
      !chapters.length ||
      loadingUserProgress ||
      userProgress !== null
    ) {
      return;
    }
    if (hasAutoRegisteredRef.current) return;
    hasAutoRegisteredRef.current = true;

    const progressPercent = Math.round((chapter.ordem / chapters.length) * 100);
    supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          book_id: bookId,
          last_chapter_id: chapterId,
          progress_percent: progressPercent,
        },
        { onConflict: 'user_id,book_id' }
      )
      .select()
      .then(({ error }) => {
        if (error) {
          console.warn('[Reader] Erro ao auto-registrar em Minha Estante:', error);
          hasAutoRegisteredRef.current = false;
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['userProgress', user.id, bookId] });
        queryClient.invalidateQueries({ queryKey: ['userProgress', user.id] });
      });
  }, [user?.id, bookId, chapterId, chapter, chapters.length, loadingUserProgress, userProgress, queryClient]);

  useEffect(() => {
    async function checkPurchase() {
      if (!user || isAdmin) return;
      const { data } = await supabase.from('minha_estante').select('*').eq('user_id', user.id).eq('livro_id', bookId).eq('status', 'pago').maybeSingle();
      if (data) setIsPurchased(true);
    }
    checkPurchase();
  }, [user, bookId, isAdmin]);

  useEffect(() => {
    if (!chapter || !chapterId) return;
    const ok = isAdmin || chapter.is_gratuito || isPurchased;
    if (!ok) setShowLockedModal(true);
  }, [chapterId, isAdmin, isPurchased, chapter?.is_gratuito, chapter]);

  const handleNavigate = (nextOrPrevIndex) => {
    const targetChapter = chapters[nextOrPrevIndex];
    if (targetChapter) {
      navigate(`/Reader?bookId=${bookId}&chapterId=${targetChapter.id}`);
      window.scrollTo(0, 0);
    }
  };

  const handleBuy = () => {
    if (!book?.link_stripe) return;
    let checkoutUrl = book.link_stripe;
    const separator = checkoutUrl.includes('?') ? '&' : '?';
    if (user) checkoutUrl = `${checkoutUrl}${separator}client_reference_id=${user.id}`;
    window.open(checkoutUrl, '_blank');
  };

  const handleBookmark = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!bookId || !chapterId || !chapter || !chapters.length) {
      console.error('Dados faltando:', { bookId, chapterId, chapter: !!chapter, chaptersLength: chapters.length });
      toast.error('Erro: dados do capítulo não encontrados.');
      return;
    }
    
    try {
      // Se já está marcado, desmarcar (deletar o progresso)
      if (isChapterMarked) {
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId);
        
        if (error) {
          console.error('Erro ao desmarcar capítulo:', error);
          toast.error(`Não foi possível desmarcar o capítulo: ${error.message}`);
          return;
        }
        
        queryClient.invalidateQueries({ queryKey: ['userProgress', user.id, bookId] });
        toast.success('Capítulo desmarcado!');
        return;
      }
      
      // Se não está marcado, marcar (criar/atualizar o progresso)
      const progressPercent = Math.round((chapter.ordem / chapters.length) * 100);
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          { 
            user_id: user.id, 
            book_id: bookId, 
            last_chapter_id: chapterId, 
            progress_percent: progressPercent 
          },
          { onConflict: 'user_id,book_id' }
        )
        .select();
      
      if (error) {
        console.error('Erro ao salvar progresso:', error);
        toast.error(`Não foi possível marcar o capítulo: ${error.message}`);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['userProgress', user.id, bookId] });
      toast.success('Capítulo marcado!');
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.error('Erro inesperado ao marcar/desmarcar capítulo.');
    }
  };

  if (!chapter || !book || loadingChapter) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin w-8 h-8 border-4 border-[#3065DF] border-t-transparent rounded-full" /></div>;

  const canRead = isAdmin || (chapter && chapter.is_gratuito) || isPurchased;
  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;
  const priceFormatted = `R$ ${(Number(book?.preco) || 6.9).toFixed(2).replace('.', ',')}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${!isAdmin ? 'select-none' : ''}`} style={{ backgroundColor: currentTheme.bg }}>
      
      {/* CABEÇALHO */}
      <div className="sticky top-0 z-30 shadow-sm border-b backdrop-blur-md bg-opacity-95 pointer-events-auto select-auto" style={{ backgroundColor: currentTheme.bg, borderColor: readerSettings.theme === 'dark' ? '#333' : '#f0f0f0' }}>
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => navigate(`/BookDetails?id=${bookId}`)} title="Voltar" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-150 hover:bg-black/5 active:scale-95 active:opacity-80 cursor-pointer pointer-events-auto select-auto touch-manipulation" style={{ color: currentTheme.text }}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
            </button>
            <button type="button" onClick={() => setShowChapters(true)} title="Sumário" className="h-9 sm:h-10 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 border bg-transparent transition-all duration-150 hover:bg-[#3065DF]/10 active:scale-[0.98] active:bg-[#3065DF]/15 cursor-pointer pointer-events-auto select-auto touch-manipulation" style={{ color: currentTheme.text, borderColor: 'transparent' }}>
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none flex-shrink-0" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold pointer-events-none whitespace-nowrap">Capítulos</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              type="button"
              onClick={handleBookmark}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              title={isChapterMarked ? "Capítulo marcado" : "Marcar capítulo"} 
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 active:opacity-80 cursor-pointer pointer-events-auto relative z-10 select-auto touch-manipulation ${
                isChapterMarked 
                  ? 'bg-[#3065DF]/10 hover:bg-[#3065DF]/20' 
                  : 'hover:bg-black/5'
              }`}
              style={{ color: isChapterMarked ? '#3065DF' : currentTheme.text }}
            >
              {isChapterMarked ? (
                <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none fill-[#3065DF]" />
              ) : (
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
              )}
            </button>
            <ReaderSettings settings={readerSettings} onSettingsChange={(s) => { setReaderSettings(s); localStorage.setItem('readerSettings', JSON.stringify(s)); }} triggerClassName="h-9 sm:h-10 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 border bg-transparent transition-all duration-150 hover:bg-[#3065DF]/10 active:scale-[0.98] active:bg-[#3065DF]/15 touch-manipulation" triggerStyle={{ color: currentTheme.text, borderColor: 'transparent' }} />
            <ShareButton bookId={bookId} bookTitle={book.titulo} chapterId={chapterId} chapterTitle={chapter?.titulo} className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border bg-transparent transition-all duration-150 hover:bg-[#3065DF]/10 active:scale-[0.98] active:bg-[#3065DF]/15 touch-manipulation" style={{ color: currentTheme.text, borderColor: 'transparent' }} />
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-10 pb-32 sm:pb-40">
        {canRead ? (
          <>
            {chapter.imagem_url && <img src={chapter.imagem_url} className="w-full rounded-xl sm:rounded-2xl mb-6 sm:mb-8 md:mb-10 shadow-sm" alt="Cena" />}
            {chapter.audio_url && <div className="mb-8 sm:mb-10 md:mb-12"><AudioPlayer audioUrl={chapter.audio_url} chapterTitle={chapter.titulo} /></div>}
            <div className="mb-8 sm:mb-12" style={{ color: currentTheme.text }}>
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold block mb-2 sm:mb-3">
                {book.titulo} • Capítulo {chapter.ordem}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight" style={{ fontFamily: currentFont }}>{chapter.titulo}</h2>
            </div>
            <div className="reader-content">
              <ReactMarkdown className="prose max-w-none" components={{ p: ({ children }) => <p className="mb-8" style={{ fontSize: `${readerSettings.fontSize}px`, lineHeight: readerSettings.lineHeight, fontFamily: currentFont, color: currentTheme.text }}>{children}</p> }}>
                {chapter.conteudo || "..."}
              </ReactMarkdown>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8 sm:mb-12" style={{ color: currentTheme.text }}>
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold block mb-2 sm:mb-3">
                {book.titulo} • Capítulo {chapter.ordem}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight" style={{ fontFamily: currentFont }}>{chapter.titulo}</h2>
            </div>
            <div className="py-16 rounded-2xl bg-gray-100/80 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-4" style={{ color: currentTheme.text }}>
              <Lock className="w-12 h-12 opacity-40" />
              <p className="text-sm opacity-70 text-center max-w-sm">Este capítulo é exclusivo para compradores do livro.</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Modal capítulo bloqueado */}
      <Dialog open={!canRead && showLockedModal} onOpenChange={setShowLockedModal}>
        <DialogContent className="max-w-sm rounded-2xl sm:rounded-[32px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-4 sm:p-6 md:p-8 pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8 text-center space-y-4 sm:space-y-5 md:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 px-2">Você chegou ao final desta amostra!</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 font-normal leading-relaxed px-2">Adquira o livro completo e tenha acesso a todos os capítulos!</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mx-2">
              <p className="text-xs text-gray-500 mb-1">Preço do livro</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{priceFormatted}</p>
            </div>
            <Button onClick={handleBuy} className="w-full bg-[#FF0864] hover:bg-[#D10050] text-white py-5 sm:py-7 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-pink-100 mx-2 active:scale-[0.98]">
              Comprar Livro Completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Login */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-sm rounded-2xl sm:rounded-[32px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-4 sm:p-6 md:p-8 pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8 text-center space-y-4 sm:space-y-5 md:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-[#3065DF]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 px-2">Faça login para marcar capítulos</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 font-normal leading-relaxed px-2">Entre na sua conta para salvar seu progresso de leitura e marcar capítulos favoritos.</p>
            </div>
            <div className="space-y-3 px-2">
              <Button 
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login');
                }} 
                className="w-full bg-[#FF0864] hover:bg-[#D10050] text-white py-5 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-pink-100 active:scale-[0.98]"
              >
                Fazer Login
              </Button>
              <Button 
                onClick={() => setShowLoginModal(false)} 
                variant="outline"
                className="w-full py-5 sm:py-6 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base active:scale-[0.98]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MENU LATERAL (DRAWER) - BOXES FIXOS */}
      <Sheet open={showChapters} onOpenChange={setShowChapters}>
        <SheetContent side="left" className="w-[90vw] sm:w-[85vw] sm:max-w-md overflow-y-auto border-r-0 p-0" style={{ backgroundColor: '#F8F9FD' }}>
          <div className="p-4 sm:p-6 md:p-8">
            <SheetHeader className="pb-6 sm:pb-8 text-left">
              <SheetTitle className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Índice</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              {chapters.map((c) => {
                  const isActive = c.id === chapterId;
                  const isLocked = !c.is_gratuito && !isPurchased && !isAdmin;
                  const isRead = c.ordem < (chapter?.ordem || 0);
                  return (
                      <button 
                          key={c.id}
                          onClick={() => { navigate(`/Reader?bookId=${bookId}&chapterId=${c.id}`); setShowChapters(false); window.scrollTo(0, 0); }}
                          className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 touch-manipulation ${isActive ? 'ring-2 ring-[#3065DF] shadow-lg' : 'shadow-sm border border-gray-100'} ${isLocked ? 'opacity-70 bg-gray-50 active:border-amber-200' : 'bg-white active:border-[#3065DF]/30'}`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0 flex-1">
                            {/* BOX DO NÚMERO (AGORA FIXO) */}
                            <span className={`flex-shrink-0 text-xs font-bold w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${isActive ? 'bg-[#3065DF] text-white' : 'bg-[#E8EEFB] text-[#3065DF]'}`}>
                                {c.ordem}
                            </span>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-[#3065DF]' : 'text-gray-700'}`}>{c.titulo}</span>
                              {isLocked && <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">Exclusivo</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {isRead && !isLocked && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />}
                          {isLocked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" /> : <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#3065DF]' : 'text-gray-200'}`} />}
                        </div>
                      </button>
                  );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ReaderControls currentChapter={chapter.ordem} totalChapters={chapters.length} onPrevious={() => handleNavigate(currentIndex - 1)} onNext={() => handleNavigate(currentIndex + 1)} onShowChapters={() => setShowChapters(true)} hasPrevious={hasPrevious} hasNext={hasNext} progress={(chapter.ordem / chapters.length) * 100} user={user} />
    </div>
  );
}