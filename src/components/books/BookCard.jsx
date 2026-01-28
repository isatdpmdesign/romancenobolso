import React from 'react';
import { Card } from "@/components/ui/card";
import { BookOpen, Headphones, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const AGE_RATING_COLORS = {
  'Livre': 'bg-green-500',
  '+10': 'bg-blue-500',
  '+12': 'bg-yellow-500',
  '+14': 'bg-orange-500',
  '+16': 'bg-red-500',
  '+18': 'bg-gray-900',
  // Compatibilidade com valores antigos
  '10+': 'bg-blue-500',
  '12+': 'bg-yellow-500',
  '14+': 'bg-orange-500',
  '16+': 'bg-red-500',
  '18+': 'bg-gray-900'
};

export default function BookCard({ book, hasAudio, isAdmin = false }) {
  const isComingSoon = book.status === 'coming_soon' || book.status === 'Em Breve';
  const isDraft = book.status === 'draft' || book.status === 'Rascunho' || book.status === 'rascunho';
  
  return (
    <Link to={isComingSoon ? '#' : createPageUrl('BookDetails') + `?id=${book.id}`} onClick={(e) => isComingSoon && e.preventDefault()}>
      {/* Removi o h-full daqui para o cartão poder crescer se precisar */}
      <Card className={`group flex flex-col overflow-hidden bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-0 shadow-md rounded-xl sm:rounded-2xl ${isComingSoon ? 'opacity-90' : ''} ${isDraft ? 'border-2 border-yellow-400' : ''}`}>
        
        {/* SOLUÇÃO DEFINITIVA:
            - aspect-[2/3]: Tenta manter o formato de livro.
            - min-h-[280px]: A TRAVA DE SEGURANÇA. Em telas muito estreitas, ele força essa altura mínima e impede o achatamento.
        */}
        <div className="relative w-full aspect-[2/3] min-h-[240px] sm:min-h-[280px] overflow-hidden bg-gradient-to-br from-[#E8EEFB] to-[#FFE5EE]">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              /* O object-cover aqui garante que a imagem preencha o espaço da trava sem distorcer */
              className={`absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500 ${isComingSoon ? 'grayscale-[30%]' : ''} ${isDraft ? 'opacity-70' : ''}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-[#3065DF]/30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badge Rascunho (apenas para admin) */}
          {isDraft && isAdmin && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-semibold text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg w-fit z-20">
              <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Rascunho
            </div>
          )}
          
          {/* Badge Em Breve com Data */}
          {isComingSoon && (
            <div className="absolute top-2 left-2 right-2 flex flex-col gap-2 z-20">
              <div className="bg-[#FF0864] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-semibold text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg w-fit">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Em Breve
              </div>
              {book.data_lancamento && (
                <div className="bg-white/95 backdrop-blur text-gray-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-normal text-[10px] sm:text-xs shadow-md w-fit">
                  {(() => {
                    const date = new Date(book.data_lancamento);
                    const day = date.getDate();
                    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    const month = monthNames[date.getMonth()];
                    return `${day} de ${month}`;
                  })()}
                </div>
              )}
            </div>
          )}
          
          {/* Tag de Classificação - sempre visível quando não é rascunho ou em breve */}
          {(book.classificacao || book.age_rating) && !isComingSoon && !isDraft && (
            <div className={`absolute top-2 left-2 ${AGE_RATING_COLORS[book.classificacao || book.age_rating] || 'bg-gray-600'} text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm z-10`}>
              {book.classificacao || book.age_rating}
            </div>
          )}
          
          {/* Tag de Classificação quando é rascunho ou em breve - posicionada abaixo */}
          {(book.classificacao || book.age_rating) && (isComingSoon || (isDraft && isAdmin)) && (
            <div className={`absolute ${isComingSoon ? 'top-20' : 'top-12'} left-2 ${AGE_RATING_COLORS[book.classificacao || book.age_rating] || 'bg-gray-600'} text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm z-10`}>
              {book.classificacao || book.age_rating}
            </div>
          )}
          
          {hasAudio && !isComingSoon && (
            <div className="absolute top-2 right-2 bg-[#3065DF] text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
              <Headphones className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">Áudio</span>
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 space-y-2 flex-grow flex flex-col">
          <h3 className="font-semibold text-sm sm:text-base md:text-lg line-clamp-2 text-gray-900 dark:text-white group-hover:text-[#FF0864] transition-colors flex-grow">
            {book.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
          <div className="flex items-center justify-between pt-1 sm:pt-2">
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 font-normal">
              {book.total_chapters !== undefined 
                ? `${book.total_chapters} ${book.total_chapters === 1 ? 'cap.' : 'caps.'}`
                : '0 caps.'
              }
            </span>
          </div>
        </div>
        
        {/* Botão Ler Agora isolado na borda */}
        {!isComingSoon && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="w-full text-center py-2 sm:py-2.5 bg-[#FF0864] hover:bg-[#D10050] active:bg-[#D10050] text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation">
              LER AGORA
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}