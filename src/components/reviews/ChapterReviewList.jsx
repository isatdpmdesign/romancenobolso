import React from 'react';
import { Card } from "@/components/ui/card";
import { Star, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import moment from 'moment';

export default function ChapterReviewList({ reviews }) {
  const approvedReviews = reviews.filter(r => r.status === 'approved');

  if (approvedReviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Seja o primeiro a avaliar este capítulo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvedReviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{review.user_name}</span>
                  <span className="text-xs text-gray-500">
                    {moment(review.created_date).fromNow()}
                  </span>
                </div>
                
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {review.comment && (
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                )}

                {review.author_reply && (
                  <div className="mt-3 pl-4 border-l-2 border-purple-300 bg-purple-50 p-3 rounded-r-lg">
                    <p className="text-xs font-medium text-purple-700 mb-1">
                      ✍️ Resposta do Autor
                    </p>
                    <p className="text-sm text-gray-700">{review.author_reply}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}