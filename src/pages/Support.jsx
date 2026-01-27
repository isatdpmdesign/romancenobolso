import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  CheckCircle,
  CreditCard,
  User,
  BookOpen,
  Bug,
  Lightbulb,
  MoreHorizontal,
  ArrowLeft
} from "lucide-react";
import { motion} from 'framer-motion';
import { toast } from "sonner";
import { createPageUrl } from '@/utils';

const CATEGORY_ICONS = {
  pagamento: CreditCard,
  conta: User,
  leitura: BookOpen,
  bug: Bug,
  sugestao: Lightbulb,
  outro: MoreHorizontal
};

const CATEGORY_LABELS = {
  pagamento: 'Pagamento',
  conta: 'Minha Conta',
  leitura: 'Leitura',
  bug: 'Problema Técnico',
  sugestao: 'Sugestão',
  outro: 'Outro'
};

const FAQ_CATEGORY_LABELS = {
  geral: 'Geral',
  pagamento: 'Pagamento',
  conta: 'Conta',
  leitura: 'Leitura',
  tecnico: 'Técnico'
};

export default function Support() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('faq');
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: ''
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
    }).catch(() => setUser(null));
  }, []);

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

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myTickets', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_ticket')
        .select('*')
        .eq('user_email', user.email)
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('support_ticket')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myTickets']);
      setSubmitted(true);
      setFormData({ subject: '', message: '', category: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/Login');
      return;
    }
    if (!formData.subject || !formData.message || !formData.category) {
      toast.error('Preencha todos os campos');
      return;
    }
    createTicketMutation.mutate({
      ...formData,
      user_email: user.email,
      user_name: user.full_name || user.nickname || 'Usuário'
    });
  };

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-[#E8EEFB] dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Home'))}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Central de Ajuda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Encontre respostas ou entre em contato conosco
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'faq' 
                ? 'bg-[#3065DF] text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            Perguntas Frequentes
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'contact' 
                ? 'bg-[#3065DF] text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Fale Conosco
          </button>
        </div>

        {activeTab === 'faq' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {Object.entries(groupedFaqs).map(([category, items]) => (
              <Card key={category} className="p-6 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  {FAQ_CATEGORY_LABELS[category] || category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {items.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left text-gray-900 dark:text-white hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}

            {faqs.length === 0 && (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma pergunta frequente cadastrada ainda.</p>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {submitted ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Mensagem Enviada!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Recebemos sua mensagem e responderemos em breve pelo seu e-mail.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Enviar outra mensagem
                </Button>
              </Card>
            ) : (
              <Card className="p-6 bg-white dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Entre em Contato
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria
                    </label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({...formData, category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                          const Icon = CATEGORY_ICONS[key];
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assunto
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Resumo do seu problema ou dúvida"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Descreva detalhadamente sua dúvida ou problema..."
                      rows={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#FF0864] hover:bg-[#D10050] py-6"
                    disabled={createTicketMutation.isPending}
                  >
                    {createTicketMutation.isPending ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>

                {/* Meus Tickets */}
                {user && myTickets.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Minhas Solicitações
                    </h3>
                    <div className="space-y-3">
                      {myTickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {ticket.subject}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(ticket.created_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              ticket.status === 'respondido' 
                                ? 'bg-green-100 text-green-700' 
                                : ticket.status === 'em_andamento'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ticket.status === 'aberto' && 'Aberto'}
                              {ticket.status === 'em_andamento' && 'Em andamento'}
                              {ticket.status === 'respondido' && 'Respondido'}
                              {ticket.status === 'fechado' && 'Fechado'}
                            </span>
                          </div>
                          {ticket.admin_response && (
                            <div className="mt-3 p-3 bg-[#E8EEFB] dark:bg-gray-600 rounded-lg">
                              <p className="text-xs text-[#3065DF] dark:text-blue-300 font-medium mb-1">
                                Resposta da equipe:
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {ticket.admin_response}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}