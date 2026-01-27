import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const status = urlParams.get('status');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
    }).catch(() => {
      navigate('/Login');
    });
  }, []);

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

  // Verificar status do retorno do Mercado Pago
  useEffect(() => {
    if (status === 'success' && user && bookId && book) {
      console.log('✅ Retorno do Mercado Pago - Status: success');
      
      let attempts = 0;
      const maxAttempts = 20;

      const checkPurchase = async () => {
        try {
          console.log(`🔍 Tentativa ${attempts + 1}/${maxAttempts} - Verificando compra...`);
          
          const { data: purchases, error: purchaseError } = await supabase
            .from('purchase')
            .select('*')
            .eq('user_email', user.email)
            .eq('book_id', bookId)
            .eq('status', 'completed');
          
          if (purchaseError) throw purchaseError;

          console.log('📦 Compras encontradas:', purchases.length);

          if (purchases.length > 0) {
            console.log('✅ Compra confirmada! Redirecionando...');
            
            const { data: chapters, error: chapterError } = await supabase
              .from('chapter')
              .select('*')
              .eq('book_id', bookId)
              .order('chapter_number', { ascending: true })
              .limit(1);
            
            if (chapterError) throw chapterError;

            if (chapters.length > 0) {
              queryClient.invalidateQueries(['purchases']);
              queryClient.invalidateQueries(['myPurchases']);
              setPaymentSuccess(true);
              
              setTimeout(() => {
                navigate(createPageUrl('Reader') + `?bookId=${bookId}&chapterId=${chapters[0].id}`);
              }, 2000);
            }
          } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`⏳ Compra ainda não registrada. Tentando novamente em 3s...`);
            setTimeout(checkPurchase, 3000);
          } else {
            console.log('❌ Timeout: Compra não foi confirmada após 20 tentativas');
            alert('O pagamento está sendo processado. Você receberá um email quando for confirmado.');
            navigate(createPageUrl('BookDetails') + `?id=${bookId}`);
          }
        } catch (error) {
          console.error('❌ Erro ao verificar compra:', error);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkPurchase, 3000);
          }
        }
      };

      checkPurchase();
    } else if (status === 'failure' && bookId) {
      console.log('❌ Pagamento falhou');
      alert('O pagamento não foi aprovado. Tente novamente.');
    } else if (status === 'pending' && bookId) {
      console.log('⏳ Pagamento pendente');
      alert('Seu pagamento está pendente de aprovação. Você receberá um email quando for confirmado.');
      navigate(createPageUrl('BookDetails') + `?id=${bookId}`);
    }
  }, [status, user, bookId, book]);

  if (!book || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-16 h-16 text-white" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pagamento Confirmado! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Agora você tem acesso completo a todos os capítulos.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecionando...
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-[#E8EEFB] dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('BookDetails') + `?id=${bookId}`)}
            className="hover:bg-[#FFE5EE]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFE5EE] dark:bg-pink-900/30 rounded-full mb-6">
              <span className="text-3xl">🔓</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Desbloqueie todos os capítulos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              Continue lendo "{book.title}" sem interrupções
            </p>
            <p className="text-[#3065DF] font-medium">
              Complete sua compra abaixo
            </p>
          </div>

          <PaymentForm book={book} />
        </motion.div>
      </div>
    </div>
  );
}