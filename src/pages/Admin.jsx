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
import { ArrowLeft, Plus, Edit, Trash2, Save, X, BookOpen, FileText, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const CATEGORIES = ['Ficção', 'Não-ficção', 'Romance', 'Thriller', 'Biografia', 'Autoajuda', 'Tecnologia', 'História'];
const AGE_RATINGS = ['Livre', '10+', '12+', '14+', '16+', '18+'];

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, isAdmin } = useAuth();
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditingBook, setIsEditingBook] = useState(false);
  
  const [bookForm, setBookForm] = useState({
    title: '', author: '', description: '', category: '', age_rating: 'Livre',
    cover_image: '', cover_image_hero: '', price: 20, status: 'published', link_stripe: ''
  });

  const [isUploading, setIsUploading] = useState(false);

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

  const createBookMutation = useMutation({
    mutationFn: async (formData) => {
      await supabase.from('livros').insert([{
        titulo: formData.title, autor: formData.author, sinopse: formData.description,
        categoria: formData.category, classificacao_indicativa: formData.age_rating,
        preco: formData.price, capa_vertical_url: formData.cover_image,
        capa_url: formData.cover_image_hero, status: formData.status,
        link_stripe: formData.link_stripe, user_id: user.id
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      resetBookForm();
      toast.success('Livro criado!');
    }
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data: formData }) => {
      await supabase.from('livros').update({
        titulo: formData.title, autor: formData.author, sinopse: formData.description,
        categoria: formData.category, classificacao_indicativa: formData.age_rating,
        preco: formData.price, capa_vertical_url: formData.cover_image,
        capa_url: formData.cover_image_hero, status: formData.status, link_stripe: formData.link_stripe
      }).eq('id', id);
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

  const resetBookForm = () => {
    setBookForm({ title: '', author: '', description: '', category: '', age_rating: 'Livre', cover_image: '', cover_image_hero: '', price: 20, status: 'published', link_stripe: '' });
    setSelectedBook(null);
    setIsEditingBook(false);
  };

  const handleEditBook = (book) => {
    setBookForm({
      title: book.titulo, author: book.author, description: book.sinopse || '',
      category: book.categoria, age_rating: book.classificacao_indicativa || 'Livre',
      cover_image: book.capa_vertical_url || '', cover_image_hero: book.capa_url || '',
      price: book.preco || 20, status: book.status || 'published', link_stripe: book.link_stripe || ''
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

  if (authLoading || isLoadingBooks) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-purple-600 h-12 w-12" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="sticky top-0 z-30 bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Site</Button>
        <h1 className="text-xl font-bold text-purple-900">Painel Administrativo</h1>
        <div className="w-24"></div> 
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="books">
          <TabsList className="bg-white mb-8 rounded-2xl p-1 shadow-sm h-14">
            <TabsTrigger value="books" className="rounded-xl px-8 h-12"><BookOpen className="mr-2 h-4 w-4" /> Livros</TabsTrigger>
            <TabsTrigger value="chapters" className="rounded-xl px-8 h-12" onClick={() => navigate('/ManageChapters?bookId=' + books[0]?.id)}><FileText className="mr-2 h-4 w-4" /> Capítulos</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Livros Cadastrados</h2>
              <Button onClick={() => { resetBookForm(); setIsEditingBook(true); }} className="bg-purple-600 rounded-xl h-12 px-6 hover:bg-purple-700 shadow-lg shadow-purple-200">
                <Plus className="mr-2 h-4 w-4" /> Novo Livro
              </Button>
            </div>

            <AnimatePresence>
              {isEditingBook && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="rounded-[32px] overflow-hidden border-none shadow-2xl mb-10">
                    <CardHeader className="bg-purple-600 text-white flex flex-row items-center justify-between p-8">
                      <CardTitle>{selectedBook ? 'Editando Livro' : 'Novo Livro'}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={resetBookForm} className="text-white hover:bg-white/20 rounded-full"><X /></Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label>Título</Label><Input value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="rounded-xl border-gray-200" /></div>
                        <div className="space-y-2"><Label>Autor</Label><Input value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="rounded-xl border-gray-200" /></div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2"><Label>Categoria</Label><Select value={bookForm.category} onValueChange={v => setBookForm({...bookForm, category: v})}><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Preço</Label><Input type="number" value={bookForm.price} onChange={e => setBookForm({...bookForm, price: Number(e.target.value)})} className="rounded-xl h-12" /></div>
                        <div className="space-y-2"><Label>Link Stripe</Label><Input value={bookForm.link_stripe} onChange={e => setBookForm({...bookForm, link_stripe: e.target.value})} className="rounded-xl h-12" placeholder="https://buy.stripe.com/..." /></div>
                      </div>
                      <div className="space-y-2"><Label>Sinopse</Label><Textarea value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} className="rounded-xl min-h-[120px]" /></div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-4 bg-gray-50">
                          <Label className="font-bold">Capa Horizontal (Banner)</Label>
                          {bookForm.cover_image_hero && <img src={bookForm.cover_image_hero} className="w-full h-32 object-cover rounded-xl" alt="" />}
                          <label className="cursor-pointer bg-white px-6 py-2 rounded-xl shadow-sm border font-medium">Subir Banner<input type="file" className="hidden" onChange={e => handleCoverUpload(e, 'hero')} /></label>
                        </div>
                        <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-4 bg-gray-50">
                          <Label className="font-bold">Capa Vertical (Card)</Label>
                          {bookForm.cover_image && <img src={bookForm.cover_image} className="w-24 h-36 object-cover rounded-xl" alt="" />}
                          <label className="cursor-pointer bg-white px-6 py-2 rounded-xl shadow-sm border font-medium">Subir Vertical<input type="file" className="hidden" onChange={e => handleCoverUpload(e, 'vertical')} /></label>
                        </div>
                      </div>
                      <Button onClick={() => selectedBook ? updateBookMutation.mutate({id: selectedBook.id, data: bookForm}) : createBookMutation.mutate(bookForm)} className="w-full h-14 bg-purple-600 hover:bg-purple-700 rounded-2xl text-lg font-bold shadow-xl shadow-purple-100" disabled={updateBookMutation.isPending || createBookMutation.isPending || isUploading}>
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
                      <Button size="icon" variant="secondary" onClick={() => handleEditBook(book)} className="rounded-full bg-white/90 text-purple-600 shadow-lg"><Edit size={16} /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="destructive" className="rounded-full shadow-lg"><Trash2 size={16} /></Button></AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Excluir livro?</AlertDialogTitle><AlertDialogDescription>Isso apagará "{book.titulo}" permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Não</AlertDialogCancel><AlertDialogAction onClick={() => deleteBookMutation.mutate(book.id)} className="bg-red-600 rounded-xl">Sim, excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{book.titulo}</h3>
                    <p className="text-gray-500 text-sm mb-4">por {book.autor}</p>
                    <Button variant="outline" className="w-full rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50" onClick={() => navigate('/ManageChapters?bookId=' + book.id)}>Editar Capítulos</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}