import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, X, Minus, Plus, Type, Sun, Moon, Palette, ALargeSmall } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const THEMES = [
  { id: 'light', name: 'Claro', bg: '#FFFFFF', text: '#1f2937', icon: Sun },
  { id: 'sepia', name: 'Sépia', bg: '#F4ECD8', text: '#5c4b37', icon: Palette },
  { id: 'dark', name: 'Escuro', bg: '#1a1a1a', text: '#e5e5e5', icon: Moon },
];

const FONTS = [
  { id: 'serif', name: 'Serif', family: 'Georgia, serif' },
  { id: 'sans', name: 'Sans', family: 'system-ui, sans-serif' },
  { id: 'mono', name: 'Mono', family: 'ui-monospace, monospace' },
];

export default function ReaderSettings({ settings, onSettingsChange, triggerClassName, triggerStyle }) {
  const [open, setOpen] = React.useState(false);

  const updateSetting = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const triggerClass = triggerClassName ?? "flex items-center gap-2 h-10 px-4 rounded-full transition-colors hover:opacity-90";
  const triggerStyleMerged = triggerStyle ?? {};

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={triggerClass}
          style={Object.keys(triggerStyleMerged).length ? triggerStyleMerged : undefined}
          title="Ajustar texto"
        >
          <span className="text-sm font-medium">Aa</span>
          <span className="text-xs font-medium">Texto</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] overflow-y-auto pb-safe">
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold text-center">Ajustar Texto</SheetTitle>
        </SheetHeader>

        <div className="px-2 pb-6 space-y-6">
          {/* Tamanho da Fonte - Simplified */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tamanho</span>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{settings.fontSize}px</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => settings.fontSize > 14 && updateSetting('fontSize', settings.fontSize - 2)}
                disabled={settings.fontSize <= 14}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:bg-gray-200 disabled:opacity-40"
              >
                <span className="text-sm font-medium">A-</span>
              </button>
              
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting('fontSize', value)}
                min={14}
                max={28}
                step={2}
                className="flex-1"
              />
              
              <button
                onClick={() => settings.fontSize < 28 && updateSetting('fontSize', settings.fontSize + 2)}
                disabled={settings.fontSize >= 28}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 active:bg-gray-200 disabled:opacity-40"
              >
                <span className="text-lg font-bold">A+</span>
              </button>
            </div>
          </div>

          {/* Tema - Visual circles */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tema</span>
            
            <div className="flex justify-center gap-6">
              {THEMES.map((theme) => {
                const Icon = theme.icon;
                const isActive = settings.theme === theme.id;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => updateSetting('theme', theme.id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isActive ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: theme.bg, 
                        border: `2px solid ${theme.text}40`
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: theme.text }} />
                    </div>
                    <span className={`text-xs ${isActive ? 'font-semibold text-[#3065DF]' : 'text-gray-500'}`}>
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fonte - Horizontal scroll pills */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fonte</span>
            
            <div className="flex gap-2">
              {FONTS.map((font) => {
                const isActive = settings.fontFamily === font.id;
                
                return (
                  <button
                    key={font.id}
                    onClick={() => updateSetting('fontFamily', font.id)}
                    className={`flex-1 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-[#3065DF] text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-200'
                    }`}
                  >
                    <span 
                      className="text-sm font-medium"
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Espaçamento - Simpler */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Espaçamento</span>
              <span className="text-xs text-gray-500">{settings.lineHeight.toFixed(1)}x</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-12">Junto</span>
              <Slider
                value={[settings.lineHeight * 10]}
                onValueChange={([value]) => updateSetting('lineHeight', value / 10)}
                min={14}
                max={24}
                step={2}
                className="flex-1"
              />
              <span className="text-[10px] text-gray-400 w-12 text-right">Separado</span>
            </div>
          </div>

          {/* Margem - Icon based */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Margens</span>
            
            <div className="flex gap-2">
              {[
                { id: 'narrow', icon: '▐▌', label: 'Estreita' },
                { id: 'medium', icon: '▐ ▌', label: 'Média' },
                { id: 'wide', icon: '▐  ▌', label: 'Larga' }
              ].map((margin) => {
                const isActive = settings.margin === margin.id;
                
                return (
                  <button
                    key={margin.id}
                    onClick={() => updateSetting('margin', margin.id)}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      isActive 
                        ? 'bg-[#3065DF] text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg tracking-widest font-mono">{margin.icon}</span>
                    <span className="text-[10px]">{margin.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}