import React from 'react';
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ReaderControls({ 
  currentChapter, 
  totalChapters, 
  onPrevious, 
  onNext,
  onShowChapters,
  hasPrevious,
  hasNext
}) {
  return (
    <>
      {/* Safe area padding for iOS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40 pb-safe">
        <div className="px-4 pt-3 pb-3 space-y-2">
          {/* Progress bar com info */}
          <div className="flex items-center gap-3">
            <Progress 
              value={totalChapters > 0 ? (currentChapter / totalChapters) * 100 : 0} 
              className="h-1.5 flex-1 bg-gray-200 dark:bg-gray-700"
            />
            <button
              onClick={onShowChapters}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 active:text-[#3065DF] min-w-fit touch-manipulation"
            >
              <span>{currentChapter}/{totalChapters ?? 0}</span>
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
    </>
  );
}