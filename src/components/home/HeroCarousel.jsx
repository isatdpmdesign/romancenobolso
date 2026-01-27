import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, BookOpen, Headphones, Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const ageRatingColors = {
  'Livre': 'bg-green-500',
  '10+': 'bg-green-600',
  '12+': 'bg-yellow-500',
  '14+': 'bg-orange-500',
  '16+': 'bg-red-500',
  '18+': 'bg-red-700'
};

export default function HeroCarousel({ books, booksWithAudio, featuredData = [], firstChapters = {}, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch book interests para o usuário atual
  const { data: bookInterests = [] } = useQuery({
    queryKey: ['bookInterests', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_interest')
        .select('*')
        .eq('user_email', user.email);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const addInterestMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('book_interest')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookInterests']);
      toast.success('✅ Você será notificado quando o livro for lançado!');
    }
  });

  const handleNotifyMe = (bookId) => {
    if (!user) {
      navigate('/Login');
      return;
    }
    
    addInterestMutation.mutate({
      book_id: bookId,
      user_email: user.email,
      user_name: user.full_name
    });
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || books.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % books.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, books.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + books.length) % books.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % books.length);
  };

  if (!books.length) return null;

  const currentBook = books[currentIndex];
  const currentFeatured = featuredData.find((f) => f.book_id === currentBook.id);
  const hasAudio = booksWithAudio?.has(currentBook.id);
  const buttonType = currentFeatured?.button_type || 'read_now';
  const hasInterest = bookInterests.some(i => i.book_id === currentBook.id);

  // Seleciona imagem e posição baseado no dispositivo
  const backgroundImage = isMobile ?
  currentFeatured?.background_image_mobile || currentFeatured?.background_image || currentBook.cover_image_hero || currentBook.cover_image :
  currentFeatured?.background_image || currentBook.cover_image_hero || currentBook.cover_image;
  const backgroundPositionX = isMobile ?
  currentFeatured?.background_position_x_mobile ?? currentFeatured?.background_position_x ?? 50 :
  currentFeatured?.background_position_x ?? 50;
  const backgroundPositionY = isMobile ?
  currentFeatured?.background_position_y_mobile ?? currentFeatured?.background_position_y ?? 50 :
  currentFeatured?.background_position_y ?? 50;
  const customBadge = currentFeatured?.custom_badge || 'Novo Lançamento';
  const customDescription = currentFeatured?.custom_description || currentBook.description;

  return (
    <div className="relative h-[70vh] md:h-[60vh] overflow-hidden">
      {/* Background Image with Parallax */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBook.id}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0">

          <img
            src={backgroundImage}
            alt={currentBook.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: `${backgroundPositionX}% ${backgroundPositionY}%`
            }}
            fetchpriority="high"
          />

          {/* Gradientes sobrepostos */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBook.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl space-y-4">

            {/* Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-yellow-600 text-white px-3 py-1 text-xs font-semibold rounded-md inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80 border-0">
                {customBadge}
              </Badge>
              {currentBook.age_rating &&
              <Badge className={`${ageRatingColors[currentBook.age_rating]} text-white border-0 px-3 py-1`}>
                  {currentBook.age_rating}
                </Badge>
              }
              {hasAudio &&
              <Badge className="bg-[#3065DF] text-white border-0 px-3 py-1 flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  Audiobook
                </Badge>
              }
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              {currentBook.title}
            </h1>

            {/* Author */}
            <p className="text-base md:text-lg text-gray-300">
              por <span className="text-white font-medium">{currentBook.author}</span>
            </p>

            {/* Description */}
            <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl">
              {customDescription || "Uma história apaixonante que vai te envolver do início ao fim."}
            </p>



            {/* CTA Button */}
            <div className="flex items-center gap-4 pt-2">
              {buttonType === 'notify_launch' ? (
                <Button
                  size="lg"
                  onClick={() => handleNotifyMe(currentBook.id)}
                  disabled={hasInterest || addInterestMutation.isPending}
                  className={`${hasInterest ? 'bg-green-600 hover:bg-green-700' : 'bg-[#FF0864] hover:bg-[#D10050]'} text-white px-8 py-6 text-lg rounded-full shadow-lg transition-all hover:scale-105`}
                >
                  {hasInterest ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Você será notificado
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5 mr-2" />
                      Me Avise Quando Lançar
                    </>
                  )}
                </Button>
              ) : (
                <Link to={firstChapters[currentBook.id] ?
                  createPageUrl('Reader') + `?bookId=${currentBook.id}&chapterId=${firstChapters[currentBook.id]}` :
                  createPageUrl('BookDetails') + `?id=${currentBook.id}`
                }>
                  <Button
                    size="lg"
                    className="bg-[#FF0864] hover:bg-[#D10050] text-white py-6 text-lg font-semibold"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Começar a Ler
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>


      </div>

      {/* Dots Indicator */}
      {books.length > 1 &&
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {books.map((_, index) =>
        <button
          key={index}
          onClick={() => {
            setIsAutoPlaying(false);
            setCurrentIndex(index);
          }}
          className={`h-2 rounded-full transition-all duration-300 ${
          index === currentIndex ?
          'w-8 bg-[#FF0864]' :
          'w-2 bg-white/40 hover:bg-white/60'}`
          } />

        )}
        </div>
      }
    </div>);

}