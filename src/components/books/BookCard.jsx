import React from 'react';
import { Card } from "@/components/ui/card";
import { BookOpen, Headphones, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const AGE_RATING_COLORS = {
  'Livre': 'bg-green-500',
  '10+': 'bg-blue-500',
  '12+': 'bg-yellow-500',
  '14+': 'bg-orange-500',
  '16+': 'bg-red-500',
  '18+': 'bg-black'
};

export default function BookCard({ book, hasAudio }) {
  const isComingSoon = book.status === 'coming_soon';
  
  return (
    <Link to={isComingSoon ? '#' : createPageUrl('BookDetails') + `?id=${book.id}`} onClick={(e) => isComingSoon && e.preventDefault()}>
      <Card className={`group overflow-hidden bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 h-full border-0 shadow-md ${isComingSoon ? 'opacity-90' : ''}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-[#E8EEFB] to-[#FFE5EE]">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isComingSoon ? 'grayscale-[30%]' : ''}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-[#3065DF]/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badge Em Breve */}
          {isComingSoon && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-[#FF0864] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <Clock className="w-4 h-4" />
                Em Breve
              </div>
            </div>
          )}
          
          {book.age_rating && !isComingSoon && (
            <div className={`absolute top-2 left-2 ${AGE_RATING_COLORS[book.age_rating]} text-white text-xs font-bold px-2 py-1 rounded`}>
              {book.age_rating}
            </div>
          )}
          
          {hasAudio && !isComingSoon && (
            <div className="absolute top-2 right-2 bg-[#3065DF] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Headphones className="w-3 h-3" />
              <span>Áudio</span>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 dark:text-white group-hover:text-[#FF0864] transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {isComingSoon && book.publish_date 
                ? `Lançamento: ${new Date(book.publish_date).toLocaleDateString('pt-BR')}`
                : `${book.total_chapters || 0} capítulos`
              }
            </span>
            {!isComingSoon && (
              <span className="text-sm font-medium text-[#3065DF]">
                Ler grátis →
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}