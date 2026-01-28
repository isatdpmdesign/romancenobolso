import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List, X, Share, Plus, MoreVertical, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ReaderControls({ 
  currentChapter, 
  totalChapters, 
  onPrevious, 
  onNext,
  onShowChapters,
  hasPrevious,
  hasNext,
  progress,
  user = null // Recebe o usuário como prop
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState('android');

  useEffect(() => {
    // Não mostrar se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    
    // Não mostrar se já foi descartado permanentemente
    const dismissedPermanently = localStorage.getItem('addToHomeDismissedPermanently');
    if (dismissedPermanently) return;

    // Se logou, resetar contador e não mostrar
    if (user) {
      localStorage.removeItem('chaptersReadWithoutLogin');
      localStorage.removeItem('lastChapterRead');
      return;
    }

    // Contar capítulos lidos sem login
    const chaptersReadKey = 'chaptersReadWithoutLogin';
    const lastChapterKey = 'lastChapterRead';
    const lastChapterRead = localStorage.getItem(lastChapterKey);
    
    // Só incrementar se mudou de capítulo
    if (lastChapterRead !== currentChapter.toString()) {
      let chaptersRead = parseInt(localStorage.getItem(chaptersReadKey) || '0');
      chaptersRead += 1;
      localStorage.setItem(chaptersReadKey, chaptersRead.toString());
      localStorage.setItem(lastChapterKey, currentChapter.toString());
      
      // Mostrar modal após 3 capítulos lidos (apenas na primeira vez que chega em 3)
      if (chaptersRead === 3) {
        // Pequeno delay para melhor UX
        setTimeout(() => {
          setShowInstructions(true);
        }, 2000);
      }
    }

    const userAgent = navigator.userAgent.toLowerCase();
    setPlatform(/iphone|ipad|ipod/.test(userAgent) ? 'ios' : 'android');
  }, [currentChapter, user]);

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('addToHomeDismissedPermanently', 'true');
  };

  return (
    <>
      {/* Safe area padding for iOS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40 pb-safe">
        <div className="px-4 pt-3 pb-3 space-y-2">
          {/* Progress bar com info */}
          <div className="flex items-center gap-3">
            <Progress 
              value={(currentChapter / totalChapters) * 100} 
              className="h-1.5 flex-1 bg-gray-200 dark:bg-gray-700"
            />
            <button
              onClick={onShowChapters}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 active:text-[#3065DF] min-w-fit touch-manipulation"
            >
              <span>{currentChapter}/{totalChapters}</span>
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Navigation buttons - larger touch targets */}
          <div className="flex items-center gap-2">
            <button
              disabled={!hasPrevious}
              onClick={onPrevious}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 active:bg-[#E8EEFB] dark:active:bg-[#3065DF]/20 disabled:opacity-40 disabled:active:bg-gray-100 transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Anterior</span>
            </button>
            
            <button
              disabled={!hasNext}
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-[#3065DF] active:bg-[#1E4BB8] disabled:opacity-40 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors touch-manipulation"
            >
              <span className="text-sm font-medium text-white">Próximo</span>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions Modal - Melhorado */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-md rounded-2xl sm:rounded-3xl gap-0 p-0 overflow-hidden border-none shadow-2xl">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-br from-[#3065DF] to-[#1E4BB8] p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">Instale o App</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="rounded-full text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                Adicione o Romance no Bolso à sua tela inicial para uma experiência ainda melhor!
              </p>
            </div>
          </div>

          {/* Seletor de plataforma */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex gap-2">
              <Button
                variant={platform === 'ios' ? 'default' : 'outline'}
                onClick={() => setPlatform('ios')}
                className={`flex-1 ${platform === 'ios' ? 'bg-[#3065DF] text-white hover:bg-[#1E4BB8]' : ''}`}
              >
                🍎 iPhone
              </Button>
              <Button
                variant={platform === 'android' ? 'default' : 'outline'}
                onClick={() => setPlatform('android')}
                className={`flex-1 ${platform === 'android' ? 'bg-[#3065DF] text-white hover:bg-[#1E4BB8]' : ''}`}
              >
                🤖 Android
              </Button>
            </div>
          </div>

          {/* Conteúdo das instruções */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {platform === 'ios' ? (
              <>
                <div className="space-y-5">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">1</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Toque no botão de compartilhar</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-2">Na barra inferior do Safari</p>
                      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                        <Share className="w-4 h-4 sm:w-5 sm:h-5 text-[#3065DF]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Compartilhar</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">2</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Selecione "Adicionar à Tela de Início"</p>
                      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg mt-2">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#3065DF]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Tela de Início</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">3</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Confirme tocando em "Adicionar"</p>
                      <p className="text-xs sm:text-sm text-gray-500">O ícone aparecerá na sua tela inicial!</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-5">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">1</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Toque no menu do navegador</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-2">No Chrome, toque nos três pontinhos</p>
                      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                        <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-[#3065DF]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Menu</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">2</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Selecione "Adicionar à tela inicial"</p>
                      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg mt-2">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#3065DF]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Adicionar à tela inicial</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">3</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Confirme tocando em "Adicionar"</p>
                      <p className="text-xs sm:text-sm text-gray-500">O ícone aparecerá na sua tela inicial!</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Benefícios */}
            <div className="bg-gradient-to-r from-[#E8EEFB] to-[#FFE5EE] rounded-xl p-4 sm:p-5 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#3065DF]" />
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Benefícios</p>
              </div>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#3065DF] mt-0.5">✓</span>
                  <span>Acesso rápido com um toque</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3065DF] mt-0.5">✓</span>
                  <span>Experiência de app nativo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3065DF] mt-0.5">✓</span>
                  <span>Tela cheia sem barra do navegador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3065DF] mt-0.5">✓</span>
                  <span>Funciona offline</span>
                </li>
              </ul>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleDismiss}
                className="w-full bg-[#FF0864] hover:bg-[#D10050] active:bg-[#D10050] text-white py-5 sm:py-6 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-pink-100 active:scale-[0.98] touch-manipulation"
              >
                Entendi, obrigado!
              </Button>
              <Button
                onClick={() => setShowInstructions(false)}
                variant="ghost"
                className="w-full py-3 sm:py-4 rounded-xl text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:scale-[0.98] touch-manipulation"
              >
                Talvez depois
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}