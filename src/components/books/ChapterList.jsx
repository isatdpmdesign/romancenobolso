import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, BookOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import LockedChapterModal from './LockedChapterModal';

export default function ChapterList({ chapters, hasPurchased, onChapterClick, currentProgress, bookTitle, bookPrice, onBuyClick }) {
  const [showLockedModal, setShowLockedModal] = useState(false);
  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => {
        const isRead = currentProgress && currentProgress.chapter_number >= chapter.chapter_number;
        const isLocked = !hasPurchased && !chapter.is_free;
        
        return (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-gray-800"
              onClick={() => {
                if (isLocked) {
                  setShowLockedModal(true);
                } else {
                  onChapterClick(chapter);
                }
              }}
            >
              <div className="flex items-center gap-3 p-4">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${
                                      isRead 
                                        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' 
                                        : 'bg-[#E8EEFB] dark:bg-[#3065DF]/20 text-[#3065DF]'
                                    }`}>
                                      {chapter.chapter_number}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
                                          {chapter.title}
                                        </h3>
                                      </div>
                                    </div>
                
                <div className="flex-shrink-0 flex items-center gap-3">
                  {isRead && (
                    <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#3065DF] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              
              {!isLocked && (
                <div className="h-1 bg-gray-100 dark:bg-gray-700 w-full">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#3065DF] to-teal-500"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
      
      <LockedChapterModal
        isOpen={showLockedModal}
        onClose={() => setShowLockedModal(false)}
        onBuyClick={() => {
          setShowLockedModal(false);
          onBuyClick?.();
        }}
        bookTitle={bookTitle}
        bookPrice={bookPrice}
      />
    </div>
  );
}