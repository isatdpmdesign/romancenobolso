import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List, Smartphone, X, Share, Plus, MoreVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';

export default function ReaderControls({ 
  currentChapter, 
  totalChapters, 
  onPrevious, 
  onNext,
  onShowChapters,
  hasPrevious,
  hasNext,
  progress
}) {
  const [showAddToHome, setShowAddToHome] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState('android');

  useEffect(() => {
    const dismissedPermanently = localStorage.getItem('addToHomeDismissedPermanently');
    if (dismissedPermanently) return;

    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const userAgent = navigator.userAgent.toLowerCase();
    setPlatform(/iphone|ipad|ipod/.test(userAgent) ? 'ios' : 'android');
    setShowAddToHome(true);
  }, []);

  const handleDismiss = () => {
    setShowAddToHome(false);
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
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 active:text-[#3065DF] min-w-fit"
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
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 active:bg-[#E8EEFB] dark:active:bg-[#3065DF]/20 disabled:opacity-40 disabled:active:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Anterior</span>
            </button>
            
            <button
              disabled={!hasNext}
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-[#3065DF] active:bg-[#1E4BB8] disabled:opacity-40 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-white">Próximo</span>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Add to Home Banner - more compact */}
          {showAddToHome && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#3065DF] shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Adicione à tela inicial</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowInstructions(true)}
                  className="text-xs font-semibold text-[#FF0864] px-3 py-1.5 active:bg-pink-50 rounded-lg"
                >
                  Ver como
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 text-gray-400 active:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-0"
            >
              <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Adicionar à Tela Inicial</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowInstructions(false)}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={platform === 'ios' ? 'default' : 'outline'}
                    onClick={() => setPlatform('ios')}
                    className={platform === 'ios' ? 'bg-[#3065DF] flex-1' : 'flex-1'}
                  >
                    🍎 iPhone
                  </Button>
                  <Button
                    variant={platform === 'android' ? 'default' : 'outline'}
                    onClick={() => setPlatform('android')}
                    className={platform === 'android' ? 'bg-[#3065DF] flex-1' : 'flex-1'}
                  >
                    🤖 Android
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {platform === 'ios' ? (
                  <>
                    <p className="text-gray-600 text-sm">
                      Siga os passos abaixo para adicionar o Romance no Bolso à tela inicial do seu iPhone:
                    </p>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">1</div>
                      <div>
                        <p className="font-semibold text-gray-900">Toque no botão de compartilhar</p>
                        <p className="text-sm text-gray-500 mt-1">Na barra inferior do Safari</p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Share className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Compartilhar</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">2</div>
                      <div>
                        <p className="font-semibold text-gray-900">Selecione "Adicionar à Tela de Início"</p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Plus className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Tela de Início</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0">3</div>
                      <div>
                        <p className="font-semibold text-gray-900">Confirme tocando em "Adicionar"</p>
                        <p className="text-sm text-gray-500 mt-1">O ícone aparecerá na sua tela inicial!</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm">
                      Siga os passos abaixo para adicionar o Romance no Bolso à tela inicial do seu Android:
                    </p>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">1</div>
                      <div>
                        <p className="font-semibold text-gray-900">Toque no menu do navegador</p>
                        <p className="text-sm text-gray-500 mt-1">No Chrome, toque nos três pontinhos</p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <MoreVertical className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Menu</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">2</div>
                      <div>
                        <p className="font-semibold text-gray-900">Selecione "Adicionar à tela inicial"</p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Plus className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Adicionar à tela inicial</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0">3</div>
                      <div>
                        <p className="font-semibold text-gray-900">Confirme tocando em "Adicionar"</p>
                        <p className="text-sm text-gray-500 mt-1">O ícone aparecerá na sua tela inicial!</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-gradient-to-r from-[#E8EEFB] to-[#FFE5EE] rounded-xl p-4 mt-6">
                  <p className="font-semibold text-gray-900 mb-2">✨ Benefícios</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Acesso rápido com um toque</li>
                    <li>• Experiência de app nativo</li>
                    <li>• Tela cheia sem barra do navegador</li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    setShowInstructions(false);
                    handleDismiss();
                  }}
                  className="w-full bg-[#FF0864] hover:bg-[#D10050] py-6"
                >
                  Entendi!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}