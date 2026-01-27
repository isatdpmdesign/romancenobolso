import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShoppingCart, List, ChevronRight } from "lucide-react"; 
import ReactMarkdown from 'react-markdown';
import ReaderControls from '../components/reader/ReaderControls';
import ReaderSettings from '../components/reader/ReaderSettings';
import ShareButton from '../components/books/ShareButton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AudioPlayer from '../components/reader/AudioPlayer';
import { motion } from 'framer-motion';

// CONFIGURAÇÃO DE CORES (Atualizada para combinar com o botão "Aa")
const THEMES = {
  light: { 
    bg: '#FFFFFF', 
    text: '#1f2937', 
    ui: '#f3f4f6', 
    buttonBg: '#f3f4f6', // Cinza bem claro
    hover: '#e5e7eb' 
  },
  sepia: { 
    bg: '#F4ECD8', 
    text: '#5c4b37', 
    ui: '#e8dec7', 
    buttonBg: '#E9E0C9', // Bege levemente mais escuro que o fundo
    hover: '#DCCFB4' 
  },
  dark: { 
    bg: '#1a1a1a', 
    text: '#e5e5e5', 
    ui: '#2d2d2d', 
    buttonBg: '#333333', // Cinza chumbo
    hover: '#404040' 
  },
};

const FONTS = {
  serif: 'Georgia, serif',
  sans: 'system-ui, sans-serif',
  mono: 'ui-monospace, monospace',
};

const DEFAULT_SETTINGS = {
  fontSize: 18,
  theme: 'sepia',
  fontFamily: 'serif',
  lineHeight: 1.8,
};

export default function Reader() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [showChapters, setShowChapters] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [readerSettings, setReaderSettings] = useState(() => {
    const saved = localStorage.getItem('readerSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('bookId');
  const chapterId = urlParams.get('chapterId');

  const currentTheme = THEMES[readerSettings.theme] || THEMES.light;
  const currentFont = FONTS[readerSettings.fontFamily] || FONTS.serif;

  // --- VERIFICAÇÃO DE COMPRA ---
  useEffect(() => {
    async function checkPurchase() {
      if (!user || isAdmin) return;
      const { data } = await supabase
        .from('minha_estante')
        .select('*')
        .eq('user_id', user.id)
        .eq('livro_id', bookId)
        .eq('status', 'pago')
        .maybeSingle();

      if (data) setIsPurchased(true);
    }
    checkPurchase();
  }, [user, bookId, isAdmin]);

  // Proteção contra cópia
  useEffect(() => {
    if (isAdmin) return;
    const preventAll = (e) => e.preventDefault();
    document.addEventListener('copy', preventAll);
    document.addEventListener('contextmenu', preventAll);
    return () => {
      document.removeEventListener('copy', preventAll);
      document.removeEventListener('contextmenu', preventAll);
    };
  }, [isAdmin]);

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

  const handleSettingsChange = (newSettings) => {
    setReaderSettings(newSettings);
    localStorage.setItem('readerSettings', JSON.stringify(newSettings));
  };

  const handleNavigate = (nextOrPrevIndex) => {
    const targetChapter = chapters[nextOrPrevIndex];
    if (targetChapter) {
        navigate(`/Reader?bookId=${bookId}&chapterId=${targetChapter.id}`);
        window.scrollTo(0, 0);
    }
  };
  
  const handleBuy = () => {
    if (!book?.link_stripe) return alert("Link de compra não configurado.");
    let checkoutUrl = book.link_stripe;
    const separator = checkoutUrl.includes('?') ? '&' : '?';
    if (user) checkoutUrl = `${checkoutUrl}${separator}client_reference_id=${user.id}`;
    window.open(checkoutUrl, '_blank');
  };

  const canRead = isAdmin || (chapter && chapter.is_gratuito) || isPurchased;
  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  if (!chapter || !book || loadingChapter) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>;

  // TELA DE BLOQUEIO
  if (!canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-sm w-full p-6 text-center space-y-5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Capítulo Bloqueado</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Este conteúdo é exclusivo.</p>
          </div>
          <button onClick={handleBuy} className="w-full bg-[#FF0864] hover:bg-[#D10050] text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all">
            <ShoppingCart className="w-4 h-4"/> Adquirir Livro Completo
          </button>
          <button onClick={() => navigate(`/BookDetails?id=${bookId}`)} className="text-sm text-gray-500 underline">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${!isAdmin ? 'select-none' : ''}`} style={{ backgroundColor: currentTheme.bg }}>
      
      {/* --- CABEÇALHO DO LEITOR --- */}
      <div 
        className="sticky top-0 z-30 shadow-sm border-b transition-colors duration-300 backdrop-blur-md bg-opacity-95"
        style={{ 
          backgroundColor: currentTheme.bg,
          borderColor: readerSettings.theme === 'dark' ? '#374151' : 'rgba(0,0,0,0.05)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto gap-4">
          
          {/* Lado Esquerdo: Botão Voltar + Botão Sumário (Estilo "Aa Texto") */}
          <div className="flex items-center gap-2 md:gap-3 flex-1">
            <button
              onClick={() => navigate(`/BookDetails?id=${bookId}`)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
              style={{ color: currentTheme.text }}
              title="Voltar aos detalhes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* BOTÃO SUMÁRIO - Estilo Pílula Igual "Aa Texto" */}
            <button
              onClick={() => setShowChapters(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-full transition-all duration-200 shadow-sm"
              style={{ 
                backgroundColor: currentTheme.buttonBg, 
                color: currentTheme.text 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.buttonBg}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Capítulos</span>
            </button>
          </div>
          
          {/* Lado Direito: Configurações + Share */}
          <div className="flex items-center gap-2">
             <ReaderSettings settings={readerSettings} onSettingsChange={handleSettingsChange} />
             <ShareButton bookId={bookId} bookTitle={book.titulo} />
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO DO CAPÍTULO --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto px-6 md:px-12 py-8 pb-40"
      >
        {chapter.imagem_url && (
            <img src={chapter.imagem_url} className="w-full rounded-xl mb-8 shadow-sm" alt="Cena do capítulo" />
        )}

        {chapter.audio_url && (
          <div className="mb-10">
             <AudioPlayer audioUrl={chapter.audio_url} chapterTitle={chapter.titulo} />
          </div>
        )}

        <div className="mb-10 text-left" style={{ color: currentTheme.text }}>
            <span className="text-xs uppercase tracking-widest opacity-60 font-bold block mb-2">
                Capítulo {chapter.ordem}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: currentFont }}>
                {chapter.titulo}
            </h2>
        </div>

        <div style={{ color: currentTheme.text }}>
            <ReactMarkdown
                className="prose max-w-none"
                components={{
                    p: ({ children }) => (
                        <p className="mb-6 text-left" style={{ 
                            fontSize: `${readerSettings.fontSize}px`,
                            lineHeight: readerSettings.lineHeight,
                            fontFamily: currentFont,
                            color: currentTheme.text
                        }}>{children}</p>
                    ),
                    h1: ({children}) => <h3 className="text-2xl font-bold mt-8 mb-4" style={{color: currentTheme.text}}>{children}</h3>,
                    h2: ({children}) => <h4 className="text-xl font-bold mt-6 mb-3" style={{color: currentTheme.text}}>{children}</h4>,
                    strong: ({children}) => <strong style={{color: currentTheme.text, fontWeight: 700}}>{children}</strong>,
                    em: ({children}) => <em style={{color: currentTheme.text}}>{children}</em>,
                    blockquote: ({children}) => <blockquote className="border-l-4 pl-4 italic my-6 opacity-80" style={{borderColor: currentTheme.text}}>{children}</blockquote>
                }}
            >
                {chapter.conteudo || "..."}
            </ReactMarkdown>
        </div>
      </motion.div>

      {/* --- MENU LATERAL (DRAWER) --- */}
      <Sheet open={showChapters} onOpenChange={setShowChapters}>
        <SheetContent 
            side="left" 
            className="w-[85vw] sm:max-w-md overflow-y-auto border-r border-gray-100 transition-colors duration-300"
            style={{ backgroundColor: currentTheme.bg, borderColor: readerSettings.theme === 'dark' ? '#374151' : '#e5e5e5' }}
        >
          <SheetHeader className="pb-6 pt-2 text-left">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
                <List className="w-6 h-6"/> Índice
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-1">
            {chapters.map((c) => {
                const isActive = c.id === chapterId;
                const isLocked = !c.is_gratuito && !isPurchased && !isAdmin;

                return (
                    <button 
                        key={c.id}
                        disabled={isLocked}
                        onClick={() => {
                            if(!isLocked) {
                                navigate(`/Reader?bookId=${bookId}&chapterId=${c.id}`);
                                setShowChapters(false);
                            }
                        }}
                        className={`
                            w-full flex items-center justify-between p-4 rounded-xl transition-all
                            ${isActive ? 'font-bold ring-1' : ''}
                            ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        style={{
                            backgroundColor: isActive ? currentTheme.buttonBg : 'transparent',
                            color: currentTheme.text,
                            borderColor: currentTheme.text
                        }}
                        onMouseEnter={(e) => !isActive && !isLocked && (e.currentTarget.style.backgroundColor = currentTheme.buttonBg)}
                        onMouseLeave={(e) => !isActive && !isLocked && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <span 
                                className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: currentTheme.ui, color: currentTheme.text }}
                            >
                                {c.ordem}
                            </span>
                            <span className="text-sm line-clamp-1">{c.titulo}</span>
                        </div>
                        {isLocked ? <Lock className="w-4 h-4 opacity-50" /> : isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* CONTROLES INFERIORES */}
      <ReaderControls
        currentChapter={chapter.ordem}
        totalChapters={chapters.length}
        onPrevious={() => handleNavigate(currentIndex - 1)}
        onNext={() => handleNavigate(currentIndex + 1)}
        onShowChapters={() => setShowChapters(true)}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        progress={(chapter.ordem / chapters.length) * 100}
      />
    </div>
  );
}