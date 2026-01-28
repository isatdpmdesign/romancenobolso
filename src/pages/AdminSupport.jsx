import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
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
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  HelpCircle, 
  MessageSquare,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const FAQ_CATEGORIES = ['geral', 'pagamento', 'conta', 'leitura', 'tecnico'];

export default function AdminSupport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // FAQ state
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'geral', order: 0, is_active: true });

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user: u }, error }) => {
        if (error || !u) {
          navigate(createPageUrl('Home'));
          return;
        }
        // Verificar se é admin (ajustar conforme sua lógica de admin)
        if (u.email !== 'isaduarte.design@gmail.com') {
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('order');
      if (error) throw error;
      return data || [];
    }
  });

  // Comments for moderation
  const { data: pendingComments = [] } = useQuery({
    queryKey: ['pendingComments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment')
        .select('*')
        .eq('status', 'pending')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // FAQ Mutations
  const createFaqMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('faq')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      resetFaqForm();
      toast.success('FAQ criada!');
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('faq')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      resetFaqForm();
      toast.success('FAQ atualizada!');
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('faq')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      toast.success('FAQ excluída!');
    }
  });

  // Toggle FAQ active status
  const toggleFaqActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('faq')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFaqs']);
      toast.success('Status da FAQ atualizado!');
    }
  });

  // Comment Mutations
  const approveCommentMutation = useMutation({
    mutationFn: async (id) => {
      const { data: result, error } = await supabase
        .from('comment')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingComments']);
      toast.success('Comentário aprovado!');
    }
  });

  const rejectCommentMutation = useMutation({
    mutationFn: async (id) => {
      const { data: result, error } = await supabase
        .from('comment')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
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
          <h1 className="text-xl font-bold text-purple-900 dark:text-white">Gerenciar FAQs & Moderação</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="faqs" className="space-y-8">
          <TabsList className="bg-white dark:bg-gray-800 shadow-md p-1">
            <TabsTrigger value="faqs" className="data-[state=active]:bg-[#3065DF] data-[state=active]:text-white">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQs ({faqs.length})
            </TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-[#3065DF] data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Moderação ({pendingComments.length})
            </TabsTrigger>
          </TabsList>

          {/* FAQs */}
          <TabsContent value="faqs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Perguntas Frequentes</h2>
              <Button onClick={() => setShowFaqForm(true)} className="bg-[#3065DF] hover:bg-[#1E4BB8]">
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
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border">
                        <Switch 
                          id="active" 
                          checked={faqForm.is_active} 
                          onCheckedChange={(checked) => setFaqForm({...faqForm, is_active: checked})} 
                        />
                        <Label htmlFor="active" className="cursor-pointer">FAQ Ativa (visível para usuários)</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveFaq} disabled={createFaqMutation.isPending || updateFaqMutation.isPending || !faqForm.question.trim() || !faqForm.answer.trim()} className="bg-[#3065DF] hover:bg-[#1E4BB8]">
                          {createFaqMutation.isPending || updateFaqMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={resetFaqForm}>Cancelar</Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {faqs.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma FAQ criada ainda.</p>
                <Button onClick={() => setShowFaqForm(true)} className="bg-[#3065DF] hover:bg-[#1E4BB8]">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira FAQ
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <Card key={faq.id} className="p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">{faq.category}</Badge>
                          <Badge variant={faq.is_active ? "default" : "secondary"} className={faq.is_active ? "bg-green-100 text-green-700" : ""}>
                            {faq.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <span className="text-xs text-gray-400">Ordem: {faq.order || 0}</span>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center gap-1">
                          <Label htmlFor={`toggle-${faq.id}`} className="text-xs text-gray-500 cursor-pointer">
                            {faq.is_active ? 'Ativa' : 'Inativa'}
                          </Label>
                          <Switch
                            id={`toggle-${faq.id}`}
                            checked={faq.is_active !== false}
                            onCheckedChange={(checked) => toggleFaqActiveMutation.mutate({ id: faq.id, is_active: checked })}
                            disabled={toggleFaqActiveMutation.isPending}
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleEditFaq(faq)} className="hover:bg-blue-50">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a FAQ "${faq.question}"?`)) {
                            deleteFaqMutation.mutate(faq.id);
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
    </div>
  );
}