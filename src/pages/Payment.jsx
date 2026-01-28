import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PaymentForm from '../components/payment/PaymentForm';
import { motion } from 'framer-motion';

export default function Payment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('bookId');
  const sessionId = urlParams.get('session_id'); // Stripe usa session_id

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) navigate('/Login');
      setUser(u);
    }).catch(() => navigate('/Login'));
  }, [navigate]);

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book')
        .select('*')
        .eq('id', bookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId
  });

  // Verificador de Compra (Sincronizado com o Webhook do Stripe)
  useEffect(() => {
    if (sessionId && user && bookId && book) {
      console.log('🔍 Stripe detectado. Verificando liberação do livro...');
      
      let attempts = 0;
      const maxAttempts = 15;

      const checkPurchase = async () => {
        try {
          const { data: purchases, error } = await supabase
            .from('purchase')
            .select('*')
            .eq('user_email', user.email)
            .eq('book_id', bookId)
            .eq('status', 'completed');
          
          if (error) throw error;

          if (purchases && purchases.length > 0) {
            console.log('✅ Compra confirmada via Webhook!');
            
            const { data: chapters } = await supabase
              .from('chapter')
              .select('id')
              .eq('book_id', bookId)
              .order('chapter_number', { ascending: true })
              .limit(1);
            
            if (chapters && chapters.length > 0) {
              queryClient.invalidateQueries(['purchases']);
              setPaymentSuccess(true);
              
              setTimeout(() => {
                navigate(createPageUrl('Reader') + `?bookId=${bookId}&chapterId=${chapters[0].id}`);
              }, 2500);
            }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkPurchase, 3000); // Tenta a cada 3 segundos
          }
        } catch (err) {
          console.error('Erro na verificação:', err);
        }
      };

      checkPurchase();
    }
  }, [sessionId, user, bookId, book, navigate, queryClient]);

  if (!book || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin w-12 h-12 border-4 border-[#3065DF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center space-y-6">
          <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pagamento Confirmado! 🎉</h2>
          <p className="text-gray-600 dark:text-gray-400">Boa leitura, a história de {book.title} espera por você.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-[#E8EEFB] dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-[#FFE5EE]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Desbloqueie "{book.title}"</h1>
        <PaymentForm book={book} />
      </div>
    </div>
  );
}