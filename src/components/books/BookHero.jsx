import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star } from "lucide-react";

const AGE_RATING_COLORS = {
  'Livre': 'bg-green-500',
  '10+': 'bg-blue-500',
  '12+': 'bg-yellow-500',
  '14+': 'bg-orange-500',
  '16+': 'bg-red-500',
  '18+': 'bg-black'
};

export default function BookHero({ book, onStartReading, onSynopsisClick }) {
  // Usa cover_image_hero se disponível, senão usa cover_image
  const heroImage = book.cover_image_hero || book.cover_image;

  return (
    <div className="relative w-full min-h-[70vh] md:min-h-[80vh] text-white overflow-hidden">
      {/* Background com a capa hero */}
      {heroImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroImage})`,
          }}
        />
      )}
      
      {/* Overlay gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      
      {/* Conteúdo */}
      <div className="relative h-full max-w-7xl mx-auto px-6 py-16 md:py-24 flex items-end">
        <div className="grid md:grid-cols-[1fr_300px] gap-8 items-end w-full pb-8">
          {/* Informações do livro */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-white/10 text-white/90 text-sm px-3 py-1 rounded-md">
                {book.category}
              </span>
              {book.age_rating && (
                <span className={`${AGE_RATING_COLORS[book.age_rating]} text-white text-sm font-semibold px-2.5 py-0.5 rounded-md`}>
                  {book.age_rating}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-lg">
              {book.title}
            </h1>
            
            <p className="text-xl text-white/90 drop-shadow">
              por {book.author}
            </p>
            
            {book.description && (
              <p 
                onClick={onSynopsisClick}
                className="text-sm md:text-base text-white/80 leading-relaxed max-w-2xl line-clamp-2 cursor-pointer hover:text-white transition-colors"
              >
                {book.description}
              </p>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-white/80">
                {book.total_chapters} capítulos
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                size="lg"
                onClick={onStartReading}
                className="bg-[#FF0864] hover:bg-[#D10050] text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Começar a Ler
              </Button>
            </div>
          </div>
          
          {/* Capa horizontal pequena */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FF0864] rounded-xl transform rotate-3 opacity-30 blur-lg"></div>
              <div className="relative aspect-[3/4] w-full max-w-[280px] rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500 border-4 border-white/20">
                {book.cover_image ? (
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white opacity-50" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}