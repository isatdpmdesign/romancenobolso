import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Share, Plus, MoreVertical, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function AddToHomeOnboarding({ open, onOpenChange }) {
  const [platform, setPlatform] = useState('android');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setPlatform(/iphone|ipad|ipod/.test(userAgent) ? 'ios' : 'android');
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe">
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="text-xl font-bold text-gray-900">Baixar app</SheetTitle>
          <p className="text-sm text-gray-500 mt-1">Adicione o Romance no Bolso à tela inicial</p>
        </SheetHeader>

        {/* Seletor de plataforma */}
        <div className="py-4 border-b border-gray-100">
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

        {/* Instruções em formato onboarding */}
        <div className="py-6 space-y-6">
          {platform === 'ios' ? (
            <>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">1</div>
                <div className="flex-1 min-w-0">
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Selecione &quot;Adicionar à Tela de Início&quot;</p>
                  <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg mt-2">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#3065DF]" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Tela de Início</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">3</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Confirme tocando em &quot;Adicionar&quot;</p>
                  <p className="text-xs sm:text-sm text-gray-500">O ícone aparecerá na sua tela inicial!</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3065DF] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">1</div>
                <div className="flex-1 min-w-0">
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Selecione &quot;Adicionar à tela inicial&quot;</p>
                  <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg mt-2">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#3065DF]" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Adicionar à tela inicial</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF0864] text-white flex items-center justify-center font-bold shrink-0 text-sm sm:text-base">3</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">Confirme tocando em &quot;Adicionar&quot;</p>
                  <p className="text-xs sm:text-sm text-gray-500">O ícone aparecerá na sua tela inicial!</p>
                </div>
              </div>
            </>
          )}

          <div className="bg-gradient-to-r from-[#E8EEFB] to-[#FFE5EE] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#3065DF]" />
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Benefícios</p>
            </div>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2"><span className="text-[#3065DF] mt-0.5">✓</span> Acesso rápido com um toque</li>
              <li className="flex items-start gap-2"><span className="text-[#3065DF] mt-0.5">✓</span> Experiência de app nativo</li>
              <li className="flex items-start gap-2"><span className="text-[#3065DF] mt-0.5">✓</span> Tela cheia sem barra do navegador</li>
            </ul>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#FF0864] hover:bg-[#D10050] text-white py-5 sm:py-6 rounded-xl font-bold text-sm sm:text-base"
          >
            Entendi!
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
