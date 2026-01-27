import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  HelpCircle, 
  MessageSquare,
  Check,
  X,
  Send,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const FAQ_CATEGORIES = ['geral', 'pagamento', 'conta', 'leitura', 'tecnico'];
const TICKET_STATUSES = {
  aberto: { label: 'Aberto', color: 'bg-yellow-100 text-yellow-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  respondido: { label: 'Respondido', color: 'bg-green-100 text-green-700' },
  fechado: { label: 'Fechado', color: 'bg-gray-100 text-gray-700' }
};

export default function AdminSupport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // FAQ state
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'geral', order: 0, is_active: true });
  
  // Ticket state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        if (u.role !== 'admin') {
          navigate(createPageUrl('Home'));
          return;
        }
        setUser(u);
        setLoading(false);
      })
      .catch(() => navigate(createPageUrl('Home')));
  }, []);

  // FAQs
  const { data: faqs = [] } = useQuery({
    queryKey: ['adminFaqs'],
    queryFn: () => base44.entities.FAQ.list('order')
  });

  // Tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['adminTickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date')
  });

  // Comments for moderation
  const { data: pendingComments = [] } = useQuery({
    queryKey: ['pendingComments'],
    queryFn: () => base44.entities.Comment.filter({ status: 'pending' }, '-created_date')
  });

  // FAQ Mutations
  const createFaqMutation = useMutation({
    mutationFn: (data) => base44.entities.FAQ.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      resetFaqForm();
      toast.success('FAQ criada!');
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FAQ.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      resetFaqForm();
      toast.success('FAQ atualizada!');
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id) => base44.entities.FAQ.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      toast.success('FAQ excluída!');
    }
  });

  // Ticket Mutations
  const respondTicketMutation = useMutation({
    mutationFn: async ({ id, response, userEmail }) => {
      await base44.entities.SupportTicket.update(id, {
        admin_response: response,
        status: 'respondido',
        responded_at: new Date().toISOString()
      });
      // Enviar notificação
      await base44.entities.Notification.create({
        user_email: userEmail,
        type: 'support_response',
        title: 'Resposta do Suporte',
        message: 'Sua solicitação foi respondida pela nossa equipe.',
        link: createPageUrl('Support')
      });
      // Enviar email
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: 'Resposta do Suporte - Romance no Bolso',
        body: `Olá!\n\nSua solicitação foi respondida:\n\n${response}\n\nAtenciosamente,\nEquipe Romance no Bolso`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTickets']);
      setSelectedTicket(null);
      setResponseText('');
      toast.success('Resposta enviada e usuário notificado!');
    }
  });

  // Comment Mutations
  const approveCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingComments']);
      toast.success('Comentário aprovado!');
    }
  });

  const rejectCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingComments']);
      toast.success('Comentário rejeitado!');
    }
  });

  const resetFaqForm = () => {
    setFaqForm({ question: '', answer: '', category: 'geral', order: 0, is_active: true });
    setEditingFaq(null);
    setShowFaqForm(false);
  };

  const handleEditFaq = (faq) => {
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order || 0,
      is_active: faq.is_active !== false
    });
    setEditingFaq(faq);
    setShowFaqForm(true);
  };

  const handleSaveFaq = () => {
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: faqForm });
    } else {
      createFaqMutation.mutate(faqForm);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#3065DF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('Admin'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Admin
          </Button>
          <h1 className="text-xl font-bold text-purple-900 dark:text-white">Suporte & Moderação</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="tickets" className="space-y-8">
          <TabsList className="bg-white dark:bg-gray-800 shadow-md p-1">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Tickets ({tickets.filter(t => t.status === 'aberto').length})
            </TabsTrigger>
            <TabsTrigger value="faqs" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Moderação ({pendingComments.length})
            </TabsTrigger>
          </TabsList>

          {/* TICKETS */}
          <TabsContent value="tickets" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets de Suporte</h2>
            
            {tickets.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum ticket de suporte</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="p-4 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-800" onClick={() => setSelectedTicket(ticket)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={TICKET_STATUSES[ticket.status]?.color}>
                            {TICKET_STATUSES[ticket.status]?.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(ticket.created_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.user_email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{ticket.message}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FAQs */}
          <TabsContent value="faqs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Perguntas Frequentes</h2>
              <Button onClick={() => setShowFaqForm(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova FAQ
              </Button>
            </div>

            <AnimatePresence>
              {showFaqForm && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <Card className="p-6 bg-white dark:bg-gray-800 shadow-xl">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">{editingFaq ? 'Editar FAQ' : 'Nova FAQ'}</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Categoria</label>
                          <Select value={faqForm.category} onValueChange={(v) => setFaqForm({...faqForm, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FAQ_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Ordem</label>
                          <Input type="number" value={faqForm.order} onChange={(e) => setFaqForm({...faqForm, order: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Pergunta</label>
                        <Input value={faqForm.question} onChange={(e) => setFaqForm({...faqForm, question: e.target.value})} placeholder="Digite a pergunta..." />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Resposta</label>
                        <Textarea value={faqForm.answer} onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})} placeholder="Digite a resposta..." rows={4} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveFaq} disabled={createFaqMutation.isPending || updateFaqMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={resetFaqForm}>Cancelar</Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <Card key={faq.id} className="p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{faq.category}</Badge>
                        {!faq.is_active && <Badge variant="secondary">Inativo</Badge>}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditFaq(faq)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteFaqMutation.mutate(faq.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* MODERATION */}
          <TabsContent value="moderation" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moderação de Comentários</h2>
            
            {pendingComments.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum comentário pendente de moderação</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingComments.map((comment) => (
                  <Card key={comment.id} className="p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center text-white font-bold shrink-0">
                        {comment.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold dark:text-white">{comment.user_name}</span>
                          <span className="text-xs text-gray-400">{new Date(comment.created_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveCommentMutation.mutate(comment.id)} className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectCommentMutation.mutate(comment.id)}>
                            <X className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Response Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={TICKET_STATUSES[selectedTicket.status]?.color}>
                    {TICKET_STATUSES[selectedTicket.status]?.label}
                  </Badge>
                  <span className="text-sm text-gray-500">{selectedTicket.category}</span>
                </div>
                <h3 className="font-semibold">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500">{selectedTicket.user_email} • {selectedTicket.user_name}</p>
                <p className="mt-3 text-gray-700">{selectedTicket.message}</p>
              </div>

              {selectedTicket.admin_response ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700 mb-1">Resposta enviada:</p>
                  <p className="text-gray-700">{selectedTicket.admin_response}</p>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={() => respondTicketMutation.mutate({ 
                      id: selectedTicket.id, 
                      response: responseText,
                      userEmail: selectedTicket.user_email
                    })}
                    disabled={!responseText.trim() || respondTicketMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {respondTicketMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Enviar Resposta
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}