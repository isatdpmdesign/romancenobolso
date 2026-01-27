import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Share, Plus, MoreVertical, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function AddToHomeFooter() {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState('android');

  useEffect(() => {
    // Não mostra na página de leitura (Reader)
    if (window.location.pathname.includes('/Reader') || window.location.search.includes('Reader')) {
      return;
    }

    // Verifica se já foi dispensado
    const dismissed = localStorage.getItem('addToHomeDismissed');
    const dismissedDate = localStorage.getItem('addToHomeDismissedDate');
    
    // Mostra novamente após 7 dias
    if (dismissed && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Verifica se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Detecta plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else {
      setPlatform('android');
    }

    // Mostra após 3 segundos
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('addToHomeDismissed', 'true');
    localStorage.setItem('addToHomeDismissedDate', Date.now().toString());
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Footer Banner */}
      <AnimatePresence>
        {!showInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-[#3065DF] to-[#FF0864] shadow-lg"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm md:text-base">Acesse mais rápido!</p>
                  <p className="text-xs md:text-sm text-white/80">Adicione à tela inicial do seu celular</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleShowInstructions}
                  className="bg-white text-[#3065DF] hover:bg-white/90 text-sm px-4"
                >
                  Como fazer
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
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
                
                {/* Platform Toggle */}
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

              {/* Instructions */}
              <div className="p-6 space-y-6">
                {platform === 'ios' ? (
                  <>
                    <p className="text-gray-600 text-sm">
                      Siga os passos abaixo para adicionar o Romance no Bolso à tela inicial do seu iPhone:
                    </p>
                    
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Toque no botão de compartilhar</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Na barra inferior do Safari, toque no ícone
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Share className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Compartilhar</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Selecione "Adicionar à Tela de Início"</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Role as opções e toque em
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Plus className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Tela de Início</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Confirme tocando em "Adicionar"</p>
                        <p className="text-sm text-gray-500 mt-1">
                          O ícone aparecerá na sua tela inicial como um app!
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm">
                      Siga os passos abaixo para adicionar o Romance no Bolso à tela inicial do seu Android:
                    </p>
                    
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Toque no menu do navegador</p>
                        <p className="text-sm text-gray-500 mt-1">
                          No Chrome, toque nos três pontinhos no canto superior direito
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <MoreVertical className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Menu</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Selecione "Adicionar à tela inicial"</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Procure a opção no menu
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Plus className="w-5 h-5 text-[#3065DF]" />
                          <span className="text-sm font-medium">Adicionar à tela inicial</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Confirme tocando em "Adicionar"</p>
                        <p className="text-sm text-gray-500 mt-1">
                          O ícone aparecerá na sua tela inicial como um app!
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Benefits */}
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