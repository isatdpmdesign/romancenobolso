import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ChapterReviewForm({ chapterId, bookId, user, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.ChapterReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', chapterId]);
      setRating(0);
      setComment('');
      toast.success('Avaliação enviada! Será publicada após moderação.');
      if (onSuccess) onSuccess();
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Por favor, dê uma nota');
      return;
    }

    createReviewMutation.mutate({
      chapter_id: chapterId,
      book_id: bookId,
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      rating,
      comment,
      status: 'pending'
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
      <h3 className="font-semibold text-gray-900 mb-4">Avalie este capítulo</h3>
      
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </motion.button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Deixe um comentário sobre este capítulo... (opcional)"
        className="mb-4 min-h-[100px]"
      />

      <Button
        onClick={handleSubmit}
        disabled={createReviewMutation.isPending || rating === 0}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {createReviewMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        Enviar Avaliação
      </Button>
    </Card>
  );
}