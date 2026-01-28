import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_CATEGORIES = ['geral', 'pagamento', 'conta', 'leitura', 'tecnico'];

export default function Support() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedFaqs, setExpandedFaqs] = useState({});

  // FAQs - apenas ativas
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .eq('is_active', true)
        .order('order');
      if (error) throw error;
      return data || [];
    }
  });

  const toggleFaq = (id) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-[#E8EEFB] dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4 sm:mb-6 hover:bg-[#FFE5EE] h-8 sm:h-9 text-xs sm:text-sm touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> <span className="hidden xs:inline">Voltar</span>
        </Button>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 px-2">
            Central de Suporte
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
            Estamos aqui para ajudar você!
          </p>
        </div>

        <div className="space-y-6">

          {/* FAQs */}
          <div className="space-y-6">
            {Object.keys(faqsByCategory).length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma FAQ disponível no momento.</p>
              </Card>
            ) : (
              Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                <div key={category} className="space-y-2 sm:space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white capitalize px-1">
                    {category}
                  </h2>
                  {categoryFaqs.map((faq) => (
                    <Card 
                      key={faq.id} 
                      className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md active:shadow-md transition-all cursor-pointer touch-manipulation"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex-1 text-left">
                            {faq.question}
                          </CardTitle>
                          {expandedFaqs[faq.id] ? (
                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      <AnimatePresence>
                        {expandedFaqs[faq.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                                {faq.answer}
                              </p>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
