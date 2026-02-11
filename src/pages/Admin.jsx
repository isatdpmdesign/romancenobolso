import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, BookOpen, FileText, Upload, Loader2, LayoutGrid, GripVertical, HelpCircle, Calendar } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const CATEGORIES = ['Ficção', 'Não-ficção', 'Romance', 'Thriller', 'Biografia', 'Autoajuda', 'Tecnologia', 'História'];
const AGE_RATINGS = ['Livre', '+10', '+12', '+14', '+16', '+18'];
const STATUS_OPTIONS = ['Publicado', 'Em Breve', 'Rascunho'];

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, isAdmin } = useAuth();
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditingBook, setIsEditingBook] = useState(false);
  
  const [bookForm, setBookForm] = useState({
    title: '', 
    author: '', 
    description: '', 
    category: '', 
    classificacao: 'Livre', 
    cover_image: '', 
    cover_image_hero: '', 
    price: 20, 
    status: 'Publicado', 
    link_stripe: '', 
    secao_home: null,
    data_lancamento: '',
    serie_em_andamento: false,
    proximo_capitulo_em: '',
    cronograma_texto: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para gerenciamento de seções
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionForm, setSectionForm] = useState({ nome: '' });

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  const { data: books = [], isLoading: isLoadingBooks } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('livros').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', selectedBook?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('capitulos').select('*').eq('livro_id', selectedBook.id).order('ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBook
  });

  // Buscar seções da home dinamicamente
  const { data: homeSections = [], isLoading: isLoadingSections } = useQuery({
    queryKey: ['home_sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // Função para notificar usuários sobre novo livro
  const notifyUsersAboutNewBook = async (bookId, bookTitle) => {
    try {
      const emails = new Set();
      
      // 1. Buscar emails de book_interest (usuários que se interessaram por livros)
      const { data: interestUsers } = await supabase
        .from('book_interest')
        .select('user_email');
      if (interestUsers) {
        interestUsers.forEach(i => {
          if (i.user_email) emails.add(i.user_email);
        });
      }

      // 2. Buscar emails de comentários
      const { data: commentUsers } = await supabase
        .from('comment')
        .select('user_email')
        .limit(2000);
      if (commentUsers) {
        commentUsers.forEach(c => {
          if (c.user_email) emails.add(c.user_email);
        });
      }

      // 3. Buscar emails de compras (minha_estante)
      const { data: purchaseUsers } = await supabase
        .from('minha_estante')
        .select('user_email');
      if (purchaseUsers) {
        purchaseUsers.forEach(p => {
          if (p.user_email) emails.add(p.user_email);
        });
      }

      // 4. Buscar emails de notificações anteriores (usuários que já receberam notificações)
      const { data: previousNotifications } = await supabase
        .from('notification')
        .select('user_email')
        .limit(2000);
      if (previousNotifications) {
        previousNotifications.forEach(n => {
          if (n.user_email) emails.add(n.user_email);
        });
      }

      // 5. Tentar buscar emails via RPC function (se existir) ou usar uma edge function
      // Por enquanto, vamos usar os emails que já coletamos

      // Criar notificações para todos os emails encontrados
      const notifications = Array.from(emails).map(email => ({
        user_email: email,
        type: 'new_book',
        title: `📚 Novo livro lançado: "${bookTitle}"`,
        message: `Um novo romance acaba de ser publicado! Venha descobrir essa nova história.`,
        link: `/BookDetails?id=${bookId}`,
        related_id: bookId
      }));

      if (notifications.length > 0) {
        // Inserir em lotes de 100 para evitar problemas de tamanho
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
          const batch = notifications.slice(i, i + batchSize);
          const { error } = await supabase.from('notification').insert(batch);
          if (error) {
            console.error(`Erro ao inserir lote ${i / batchSize + 1}:`, error);
          }
        }
        toast.success(`✅ ${notifications.length} usuários notificados sobre o novo livro!`);
        console.log(`✅ ${notifications.length} notificações criadas para o livro "${bookTitle}"`);
      } else {
        console.log('⚠️ Nenhum email encontrado para notificar');
      }
    } catch (error) {
      console.error('Erro ao criar notificações:', error);
      toast.error('Livro criado, mas houve erro ao enviar notificações.');
      // Não falhar a criação do livro se a notificação falhar
    }
  };

  const createBookMutation = useMutation({
    mutationFn: async (formData) => {
      const { data: newBook, error } = await supabase.from('livros').insert([{
        titulo: formData.title, autor: formData.author, sinopse: formData.description,
        categoria: formData.category, classificacao: formData.classificacao,
        preco: formData.price, capa_vertical_url: formData.cover_image,
        capa_url: formData.cover_image_hero, status: formData.status === 'Publicado' ? 'published' : formData.status === 'Em Breve' ? 'coming_soon' : 'draft',
        link_stripe: formData.link_stripe, secao_home: formData.secao_home === 'Nenhuma' || !formData.secao_home ? null : formData.secao_home,
        data_lancamento: formData.status === 'Em Breve' && formData.data_lancamento ? formData.data_lancamento : null,
        user_id: user.id,
        serie_em_andamento: formData.serie_em_andamento ?? false,
        proximo_capitulo_em: formData.serie_em_andamento && formData.proximo_capitulo_em ? formData.proximo_capitulo_em : null,
        cronograma_texto: formData.serie_em_andamento && formData.cronograma_texto ? formData.cronograma_texto.trim() || null : null
      }]).select().single();
      
      if (error) throw error;
      
      // Se o livro foi publicado, notificar usuários
      if (formData.status === 'Publicado' && newBook) {
        await notifyUsersAboutNewBook(newBook.id, newBook.titulo);
      }
      
      return newBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      resetBookForm();
      toast.success('Livro criado!');
    }
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data: formData }) => {
      // Buscar o livro atual para verificar se mudou de status
      const { data: currentBook } = await supabase
        .from('livros')
        .select('status, titulo')
        .eq('id', id)
        .single();
      
      const newStatus = formData.status === 'Publicado' ? 'published' : formData.status === 'Em Breve' ? 'coming_soon' : 'draft';
      const wasPublished = currentBook?.status === 'published';
      const isNowPublished = newStatus === 'published';
      
      await supabase.from('livros').update({
        titulo: formData.title, autor: formData.author, sinopse: formData.description,
        categoria: formData.category, classificacao: formData.classificacao,
        preco: formData.price, capa_vertical_url: formData.cover_image,
        capa_url: formData.cover_image_hero, status: newStatus, 
        link_stripe: formData.link_stripe, secao_home: formData.secao_home || null,
        data_lancamento: formData.status === 'Em Breve' && formData.data_lancamento ? formData.data_lancamento : null,
        serie_em_andamento: formData.serie_em_andamento ?? false,
        proximo_capitulo_em: formData.serie_em_andamento && formData.proximo_capitulo_em ? formData.proximo_capitulo_em : null,
        cronograma_texto: formData.serie_em_andamento && formData.cronograma_texto ? formData.cronograma_texto.trim() || null : null
      }).eq('id', id);
      
      // Se o livro foi publicado agora (mudou de status ou é novo), notificar usuários
      if (isNowPublished && !wasPublished) {
        await notifyUsersAboutNewBook(id, formData.title);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      resetBookForm();
      toast.success('Livro atualizado!');
    }
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id) => await supabase.from('livros').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      setSelectedBook(null);
      toast.success('Livro excluído.');
    }
  });

  // Mutations para gerenciar seções
  const createSectionMutation = useMutation({
    mutationFn: async (nome) => {
      // Pegar a maior ordem atual e adicionar 1
      const maxOrder = homeSections.length > 0 
        ? Math.max(...homeSections.map(s => s.ordem || 0)) 
        : 0;
      
      const { data, error } = await supabase
        .from('home_sections')
        .insert([{ nome, ordem: maxOrder + 1, ativo: true }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['home_sections']);
      setSectionForm({ nome: '' });
      setIsEditingSection(false);
      toast.success('Seção criada!');
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, nome }) => {
      const { error } = await supabase
        .from('home_sections')
        .update({ nome })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['home_sections']);
      setEditingSectionId(null);
      setSectionForm({ nome: '' });
      toast.success('Seção atualizada!');
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('home_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['home_sections']);
      toast.success('Seção excluída.');
    }
  });

  const reorderSectionMutation = useMutation({
    mutationFn: async ({ sourceIndex, destinationIndex }) => {
      if (sourceIndex === destinationIndex) return;
      
      const reorderedSections = Array.from(homeSections);
      const [removed] = reorderedSections.splice(sourceIndex, 1);
      reorderedSections.splice(destinationIndex, 0, removed);
      
      // Atualizar todas as ordens sequencialmente
      const updates = reorderedSections.map((section, index) => 
        supabase
          .from('home_sections')
          .update({ ordem: index + 1 })
          .eq('id', section.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['home_sections']);
      toast.success('Ordem atualizada!');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    reorderSectionMutation.mutate({ sourceIndex, destinationIndex });
  };

  const resetBookForm = () => {
    setBookForm({ 
      title: '', 
      author: '', 
      description: '', 
      category: '', 
      classificacao: 'Livre', 
      cover_image: '', 
      cover_image_hero: '', 
      price: 20, 
      status: 'Publicado', 
      link_stripe: '', 
      secao_home: null,
      data_lancamento: '',
      serie_em_andamento: false,
      proximo_capitulo_em: '',
      cronograma_texto: ''
    });
    setSelectedBook(null);
    setIsEditingBook(false);
  };

  const handleEditBook = (book) => {
    if (!book) return;
    // Converter status do banco para o formato do formulário
    let statusForm = 'Publicado';
    if (book.status === 'coming_soon') statusForm = 'Em Breve';
    else if (book.status === 'draft') statusForm = 'Rascunho';
    
    setBookForm({
      title: book?.titulo || '', 
      author: book?.autor || '', 
      description: book?.sinopse || '',
      category: book?.categoria || '', 
      classificacao: book?.classificacao || 'Livre',
      cover_image: book?.capa_vertical_url || '', 
      cover_image_hero: book?.capa_url || '',
      price: book?.preco || 20, 
      status: statusForm, 
      link_stripe: book?.link_stripe || '', 
      secao_home: book?.secao_home || null,
      data_lancamento: book?.data_lancamento || '',
      serie_em_andamento: book?.serie_em_andamento ?? false,
      proximo_capitulo_em: book?.proximo_capitulo_em ? book.proximo_capitulo_em.slice(0, 10) : '',
      cronograma_texto: book?.cronograma_texto || ''
    });
    setSelectedBook(book);
    setIsEditingBook(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCoverUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `capas/${fileName}`;
      await supabase.storage.from('capas').upload(filePath, file);
      const { data } = supabase.storage.from('capas').getPublicUrl(filePath);
      setBookForm(prev => ({ ...prev, [type === 'vertical' ? 'cover_image' : 'cover_image_hero']: data.publicUrl }));
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro no upload.');
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || isLoadingBooks) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-[#3065DF] h-12 w-12" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="sticky top-0 z-30 bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Site</Button>
        <h1 className="text-xl font-semibold text-[#3065DF]">Painel Administrativo</h1>
        <Button 
          onClick={() => navigate('/AdminSupport')} 
          className="bg-[#3065DF] hover:bg-[#1E4BB8] rounded-xl px-4 h-9 shadow-sm"
        >
          <HelpCircle className="mr-2 h-4 w-4" /> FAQs & Suporte
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="books">
          <TabsList className="bg-white mb-8 rounded-2xl p-1 shadow-sm h-14">
            <TabsTrigger value="books" className="rounded-xl px-8 h-12"><BookOpen className="mr-2 h-4 w-4" /> Livros</TabsTrigger>
            <TabsTrigger value="chapters" className="rounded-xl px-8 h-12" onClick={() => navigate('/ManageChapters?bookId=' + books[0]?.id)}><FileText className="mr-2 h-4 w-4" /> Capítulos</TabsTrigger>
            <TabsTrigger value="sections" className="rounded-xl px-8 h-12"><LayoutGrid className="mr-2 h-4 w-4" /> Organizar Home</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Livros Cadastrados</h2>
              <Button onClick={() => { resetBookForm(); setIsEditingBook(true); }} className="bg-[#3065DF] rounded-xl h-12 px-6 hover:bg-[#2554C4] shadow-lg shadow-blue-200">
                <Plus className="mr-2 h-4 w-4" /> Novo Livro
              </Button>
            </div>

            <AnimatePresence>
              {isEditingBook && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="rounded-[32px] overflow-hidden border-none shadow-2xl mb-10">
                    <CardHeader className="bg-[#3065DF] text-white flex flex-row items-center justify-between p-8">
                      <CardTitle>{selectedBook ? 'Editando Livro' : 'Novo Livro'}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={resetBookForm} className="text-white hover:bg-white/20 rounded-full"><X /></Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                        <Label className="text-gray-700 font-normal">Título</Label>
                        <Input value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="rounded-xl border-gray-200" />
                      </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-normal">Autor</Label>
                          <Input value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="rounded-xl border-gray-200" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-normal">Categoria</Label>
                          <Select value={bookForm.category} onValueChange={v => setBookForm({...bookForm, category: v})}>
                            <SelectTrigger className="rounded-xl h-12 border-gray-200">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-normal">Classificação Indicativa</Label>
                          <Select value={bookForm.classificacao || 'Livre'} onValueChange={v => setBookForm({...bookForm, classificacao: v})}>
                            <SelectTrigger className="rounded-xl h-12 border-gray-200">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {AGE_RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-normal">Status</Label>
                          <Select value={bookForm.status || 'Publicado'} onValueChange={v => setBookForm({...bookForm, status: v})}>
                            <SelectTrigger className="rounded-xl h-12 border-gray-200">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-normal">Preço</Label>
                          <Input type="number" value={bookForm.price} onChange={e => setBookForm({...bookForm, price: Number(e.target.value)})} className="rounded-xl h-12 border-gray-200" />
                        </div>
                      </div>
                      {bookForm.status === 'Em Breve' && (
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-normal">Data de Lançamento</Label>
                          <Input 
                            type="date" 
                            value={bookForm.data_lancamento} 
                            onChange={e => setBookForm({...bookForm, data_lancamento: e.target.value})} 
                            className="rounded-xl h-12 border-gray-200" 
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                        <div>
                          <Label className="text-gray-700 font-normal">História em andamento</Label>
                          <p className="text-xs text-gray-500 mt-0.5">Liberar capítulos aos poucos e avisar o leitor (ex: &quot;Novos capítulos segundas e quartas&quot;)</p>
                        </div>
                        <Switch
                          checked={bookForm.serie_em_andamento ?? false}
                          onCheckedChange={v => setBookForm({ ...bookForm, serie_em_andamento: v })}
                        />
                      </div>
                      {bookForm.serie_em_andamento && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-normal flex items-center gap-2"><Calendar className="w-4 h-4" /> Data do próximo capítulo</Label>
                            <Input
                              type="date"
                              value={bookForm.proximo_capitulo_em || ''}
                              onChange={e => setBookForm({ ...bookForm, proximo_capitulo_em: e.target.value })}
                              className="rounded-xl h-12 border-gray-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-normal">Cronograma (texto para o leitor)</Label>
                            <Input
                              value={bookForm.cronograma_texto || ''}
                              onChange={e => setBookForm({ ...bookForm, cronograma_texto: e.target.value })}
                              className="rounded-xl h-12 border-gray-200"
                              placeholder="Ex: Novos capítulos segundas e quartas!"
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-normal">Seção da Home</Label>
                        <Select value={bookForm.secao_home ? bookForm.secao_home : 'Nenhuma'} onValueChange={v => setBookForm({...bookForm, secao_home: v === 'Nenhuma' ? null : v})}>
                          <SelectTrigger className="rounded-xl h-12 border-gray-200">
                            <SelectValue placeholder="Nenhuma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                            {homeSections.filter(s => s.ativo !== false).map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-normal">Link Stripe</Label>
                        <Input value={bookForm.link_stripe} onChange={e => setBookForm({...bookForm, link_stripe: e.target.value})} className="rounded-xl h-12 border-gray-200" placeholder="https://buy.stripe.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-normal">Sinopse</Label>
                        <Textarea value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} className="rounded-xl min-h-[120px] border-gray-200" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-4 bg-gray-50">
                          <Label className="text-gray-700 font-normal">Capa Horizontal (Banner)</Label>
                          {bookForm.cover_image_hero && <img src={bookForm.cover_image_hero} className="w-full h-32 object-cover rounded-xl" alt="" />}
                          <label className="cursor-pointer bg-white px-6 py-2 rounded-xl shadow-sm border text-gray-700 font-normal hover:bg-gray-50 transition-colors">Subir Banner<input type="file" className="hidden" onChange={e => handleCoverUpload(e, 'hero')} /></label>
                        </div>
                        <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-4 bg-gray-50">
                          <Label className="text-gray-700 font-normal">Capa Vertical (Card)</Label>
                          {bookForm.cover_image && <img src={bookForm.cover_image} className="w-24 h-36 object-cover rounded-xl" alt="" />}
                          <label className="cursor-pointer bg-white px-6 py-2 rounded-xl shadow-sm border text-gray-700 font-normal hover:bg-gray-50 transition-colors">Subir Vertical<input type="file" className="hidden" onChange={e => handleCoverUpload(e, 'vertical')} /></label>
                        </div>
                      </div>
                      <Button onClick={() => selectedBook ? updateBookMutation.mutate({id: selectedBook.id, data: bookForm}) : createBookMutation.mutate(bookForm)} className="w-full h-14 bg-[#FF0864] hover:bg-[#D10050] rounded-2xl text-lg font-semibold shadow-xl shadow-pink-100" disabled={updateBookMutation.isPending || createBookMutation.isPending || isUploading}>
                        {isUploading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} Salvar Alterações
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid md:grid-cols-3 gap-8 pb-20">
              {books.map(book => (
                <Card key={book.id} className="rounded-[32px] overflow-hidden shadow-lg bg-white border-none group hover:shadow-2xl transition-all duration-300">
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    <img src={book.capa_url || book.capa_vertical_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button size="icon" variant="secondary" onClick={() => handleEditBook(book)} className="rounded-full bg-white/90 text-[#3065DF] shadow-lg"><Edit size={16} /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="destructive" className="rounded-full shadow-lg"><Trash2 size={16} /></Button></AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Excluir livro?</AlertDialogTitle><AlertDialogDescription>Isso apagará "{book.titulo}" permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Não</AlertDialogCancel><AlertDialogAction onClick={() => deleteBookMutation.mutate(book.id)} className="bg-red-600 rounded-xl">Sim, excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{book.titulo}</h3>
                    <p className="text-gray-500 text-sm mb-4">por {book.autor}</p>
                    <Button variant="outline" className="w-full rounded-xl border-blue-100 text-[#3065DF] hover:bg-blue-50" onClick={() => navigate('/ManageChapters?bookId=' + book.id)}>Editar Capítulos</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Seções da Home</h2>
              <Button 
                onClick={() => { setSectionForm({ nome: '' }); setIsEditingSection(true); setEditingSectionId(null); }} 
                className="bg-[#3065DF] rounded-xl h-12 px-6 hover:bg-[#2554C4] shadow-lg shadow-blue-200"
              >
                <Plus className="mr-2 h-4 w-4" /> Nova Seção
              </Button>
            </div>

            <AnimatePresence>
              {isEditingSection && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="rounded-[32px] overflow-hidden border-none shadow-2xl mb-10">
                    <CardHeader className="bg-[#3065DF] text-white flex flex-row items-center justify-between p-8">
                      <CardTitle>{editingSectionId ? 'Editar Seção' : 'Nova Seção'}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => { setIsEditingSection(false); setEditingSectionId(null); setSectionForm({ nome: '' }); }} className="text-white hover:bg-white/20 rounded-full"><X /></Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-normal">Nome da Seção</Label>
                        <Input 
                          value={sectionForm.nome} 
                          onChange={e => setSectionForm({...sectionForm, nome: e.target.value})} 
                          className="rounded-xl border-gray-200" 
                          placeholder="Ex: Adicionados Recentemente"
                        />
                      </div>
                      <Button 
                        onClick={() => editingSectionId 
                          ? updateSectionMutation.mutate({ id: editingSectionId, nome: sectionForm.nome })
                          : createSectionMutation.mutate(sectionForm.nome)
                        } 
                        className="w-full h-14 bg-[#FF0864] hover:bg-[#D10050] rounded-2xl text-lg font-semibold shadow-xl shadow-pink-100" 
                        disabled={updateSectionMutation.isPending || createSectionMutation.isPending || !sectionForm.nome.trim()}
                      >
                        {updateSectionMutation.isPending || createSectionMutation.isPending ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} Salvar
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoadingSections ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#3065DF] h-12 w-12" />
              </div>
            ) : homeSections.length === 0 ? (
              <div className="text-center py-20 bg-white/50 rounded-3xl">
                <LayoutGrid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-normal">Nenhuma seção criada ainda.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {homeSections.map((section, index) => (
                        <Draggable key={section.id} draggableId={String(section.id)} index={index}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`rounded-2xl overflow-hidden shadow-lg bg-white border-none transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'shadow-2xl scale-[1.02] border-2 border-[#3065DF]' 
                                  : 'hover:shadow-xl'
                              }`}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  {/* Grip Handle */}
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="flex-shrink-0 cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <GripVertical className="h-6 w-6 text-gray-400" />
                                  </div>

                                  {/* Badge de Ordem */}
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3065DF] to-[#1E4BB8] flex items-center justify-center shadow-md">
                                      <span className="text-white font-bold text-lg">{index + 1}</span>
                                    </div>
                                  </div>

                                  {/* Informações da Seção */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-xl text-gray-900 mb-1 truncate">
                                      {section.nome}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {section.ativo !== false ? (
                                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                          Ativa
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                          Inativa
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {/* Botões de Ação */}
                                  <div className="flex-shrink-0 flex items-center gap-3">
                                    <Button 
                                      size="lg"
                                      variant="outline" 
                                      onClick={() => { 
                                        setSectionForm({ nome: section.nome }); 
                                        setEditingSectionId(section.id); 
                                        setIsEditingSection(true); 
                                      }} 
                                      className="rounded-xl border-[#3065DF] text-[#3065DF] hover:bg-[#3065DF] hover:text-white px-6 h-11 shadow-sm"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          size="lg"
                                          variant="destructive" 
                                          className="rounded-xl px-6 h-11 shadow-sm"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Excluir
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="rounded-3xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Isso removerá "{section.nome}" permanentemente. Os livros associados não serão excluídos.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => deleteSectionMutation.mutate(section.id)} 
                                            className="bg-red-600 rounded-xl hover:bg-red-700"
                                          >
                                            Sim, excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}