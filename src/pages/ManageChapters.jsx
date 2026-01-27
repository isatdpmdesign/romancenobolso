import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Trash2, Plus, Music, Loader2, Upload, FileAudio, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

export default function ManageChapters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de Visualização (Lista vs Formulário)
  const [view, setView] = useState('list'); // 'list' ou 'form'
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Formulário
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    ordem: 1,
    is_gratuito: false,
    audio_url: '',
    imagem_url: '' // Novo campo para a capa do capítulo
  });

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!bookId) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [bookId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Pega dados do livro
      const { data: bookData } = await supabase.from('livros').select('titulo').eq('id', bookId).single();
      setBook(bookData);

      // 2. Pega capítulos
      const { data: chaptersData, error } = await supabase
        .from('capitulos')
        .select('*')
        .eq('livro_id', bookId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setChapters(chaptersData);
    } catch (error) {
      toast.error("Erro ao carregar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE UPLOAD ---
  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const bucket = type === 'audio' ? 'audios' : 'capas';
    const stateSetter = type === 'audio' ? setIsUploadingAudio : setIsUploadingImage;
    const fieldName = type === 'audio' ? 'audio_url' : 'imagem_url';

    stateSetter(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, [fieldName]: data.publicUrl }));
      toast.success("Upload concluído!");
    } catch (error) {
      toast.error(`Erro no upload: ${error.message}`);
    } finally {
      stateSetter(false);
    }
  };

  // --- SALVAR ---
  const handleSave = async () => {
    if (!formData.titulo) return toast.error("Título é obrigatório");

    setIsSaving(true);
    try {
      const payload = {
        livro_id: bookId,
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        ordem: formData.ordem,
        is_gratuito: formData.is_gratuito,
        audio_url: formData.audio_url,
        imagem_url: formData.imagem_url
      };

      if (selectedChapter) {
        await supabase.from('capitulos').update(payload).eq('id', selectedChapter.id);
        toast.success("Capítulo atualizado!");
      } else {
        await supabase.from('capitulos').insert([payload]);
        toast.success("Capítulo criado!");
      }

      await fetchData();
      setView('list'); // Volta para a lista
    } catch (error) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza?")) return;
    await supabase.from('capitulos').delete().eq('id', id);
    fetchData();
    toast.success("Capítulo excluído");
  };

  // --- NAVEGAÇÃO ENTRE TELAS ---
  const openNewChapter = () => {
    const nextOrder = chapters.length > 0 ? chapters[chapters.length - 1].ordem + 1 : 1;
    setSelectedChapter(null);
    setFormData({ titulo: '', conteudo: '', ordem: nextOrder, is_gratuito: false, audio_url: '', imagem_url: '' });
    setView('form');
  };

  const openEditChapter = (chapter) => {
    setSelectedChapter(chapter);
    setFormData({
      titulo: chapter.titulo,
      conteudo: chapter.conteudo || '',
      ordem: chapter.ordem,
      is_gratuito: chapter.is_gratuito,
      audio_url: chapter.audio_url || '',
      imagem_url: chapter.imagem_url || ''
    });
    setView('form');
  };

  if (loading && chapters.length === 0) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => view === 'form' ? setView('list') : navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {view === 'form' ? 'Voltar' : 'Gerenciar Capítulos'}
          </Button>
          <div className="text-right">
             <h1 className="text-xl font-bold text-gray-900">{book?.titulo}</h1>
             <p className="text-sm text-gray-500">{chapters.length} capítulos</p>
          </div>
        </div>

        {/* MODO LISTA (IGUAL AO VÍDEO) */}
        {view === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={openNewChapter} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2"/> Novo Capítulo
                </Button>
            </div>
            
            {chapters.length === 0 ? (
                <Card className="p-10 text-center text-gray-500">Nenhum capítulo criado.</Card>
            ) : (
                chapters.map((chapter) => (
                    <Card key={chapter.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-md">Cap. {chapter.ordem}</span>
                            <div>
                                <h3 className="font-semibold text-gray-900">{chapter.titulo}</h3>
                                {chapter.is_gratuito && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Gratuito</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditChapter(chapter)}>
                                <span className="sr-only">Editar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(chapter.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))
            )}
          </div>
        )}

        {/* MODO FORMULÁRIO (IGUAL AO VÍDEO) */}
        {view === 'form' && (
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-6">
               <div className="flex justify-between items-center border-b pb-4">
                   <h2 className="text-lg font-bold">{selectedChapter ? 'Editar Capítulo' : 'Novo Capítulo'}</h2>
                   <Button variant="ghost" size="sm" onClick={() => setView('list')}><X className="w-4 h-4"/></Button>
               </div>

               {/* Linha 1: Número e Título */}
               <div className="grid md:grid-cols-4 gap-4">
                   <div className="md:col-span-1 space-y-2">
                       <Label>Número</Label>
                       <Input type="number" value={formData.ordem} onChange={e => setFormData({...formData, ordem: Number(e.target.value)})} />
                   </div>
                   <div className="md:col-span-3 space-y-2">
                       <Label>Título do Capítulo *</Label>
                       <Input value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Ex: O Reencontro" />
                   </div>
               </div>

               {/* Toggle Gratuito */}
               <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border">
                   <Switch id="free" checked={formData.is_gratuito} onCheckedChange={c => setFormData({...formData, is_gratuito: c})} />
                   <Label htmlFor="free" className="cursor-pointer">Capítulo Gratuito (Liberado para não-assinantes)</Label>
               </div>

               {/* Uploads (Capa e Áudio) */}
               <div className="grid md:grid-cols-2 gap-6">
                   {/* Capa */}
                   <div className="space-y-2">
                       <Label>Capa do Capítulo (Opcional)</Label>
                       <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                           {formData.imagem_url ? (
                               <div className="relative group">
                                   <img src={formData.imagem_url} alt="Capa" className="h-32 mx-auto object-cover rounded-md shadow-sm" />
                                   <Button variant="destructive" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFormData({...formData, imagem_url: ''})}>
                                       <Trash2 className="w-4 h-4"/>
                                   </Button>
                               </div>
                           ) : (
                               <label className="cursor-pointer block">
                                   <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2"/>
                                   <span className="text-sm text-purple-600 font-medium">Clique para enviar capa</span>
                                   <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
                               </label>
                           )}
                           {isUploadingImage && <p className="text-xs text-purple-500 mt-2 animate-pulse">Enviando imagem...</p>}
                       </div>
                   </div>

                   {/* Áudio */}
                   <div className="space-y-2">
                       <Label>Áudio do Capítulo (MP3)</Label>
                       <div className="border-2 border-dashed border-pink-200 bg-pink-50/30 rounded-lg p-4 text-center hover:bg-pink-50 transition-colors">
                           {formData.audio_url ? (
                               <div className="text-left">
                                   <div className="flex items-center gap-2 mb-2">
                                       <FileAudio className="text-pink-600 w-5 h-5"/>
                                       <span className="text-xs text-gray-600 truncate max-w-[200px]">Áudio carregado</span>
                                   </div>
                                   <audio controls src={formData.audio_url} className="w-full h-8" />
                                   <Button variant="link" className="text-red-500 h-6 px-0 mt-1" onClick={() => setFormData({...formData, audio_url: ''})}>Remover áudio</Button>
                               </div>
                           ) : (
                               <label className="cursor-pointer block py-2">
                                   <Music className="w-8 h-8 mx-auto text-pink-400 mb-2"/>
                                   <span className="text-sm text-pink-600 font-medium">Clique para enviar áudio</span>
                                   <input type="file" accept="audio/*" className="hidden" onChange={e => handleUpload(e, 'audio')} />
                               </label>
                           )}
                           {isUploadingAudio && <p className="text-xs text-pink-500 mt-2 animate-pulse">Enviando áudio...</p>}
                       </div>
                   </div>
               </div>

               {/* Editor de Texto */}
               <div className="space-y-2">
                   <Label>Conteúdo (Markdown)</Label>
                   <p className="text-xs text-gray-400">Use **negrito** para destacar e # para títulos.</p>
                   <Textarea 
                       value={formData.conteudo} 
                       onChange={e => setFormData({...formData, conteudo: e.target.value})} 
                       className="min-h-[300px] font-mono text-sm leading-relaxed"
                       placeholder="# Título do Capítulo..."
                   />
               </div>

               {/* Botões Finais */}
               <div className="flex justify-end gap-3 pt-4 border-t">
                   <Button variant="outline" onClick={() => setView('list')}>Cancelar</Button>
                   <Button onClick={handleSave} disabled={isSaving || isUploadingAudio || isUploadingImage} className="bg-purple-600 hover:bg-purple-700 min-w-[150px]">
                       {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                       {selectedChapter ? 'Atualizar Capítulo' : 'Criar Capítulo'}
                   </Button>
               </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}