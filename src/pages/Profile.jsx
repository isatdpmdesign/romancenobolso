import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, User, Mail, Save, Trash2, Camera, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    avatarUrl: ''
  });

  // 1. Carregar dados ao entrar
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        nickname: user.user_metadata?.nickname || '',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || ''
      });
    }
  }, [user]);

  // 2. Upload de Foto de Perfil
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Envia para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pega a URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Atualiza o estado visual
      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      toast.success("Foto carregada! Clique em Salvar para confirmar.");
    } catch (error) {
      toast.error("Erro ao enviar foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 3. Salvar Alterações
  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          nickname: formData.nickname,
          avatar_url: formData.avatarUrl
        }
      });

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Excluir Conta (Zona de Perigo)
  const handleDeleteAccount = async () => {
    const confirm = window.confirm("TEM CERTEZA? Essa ação não pode ser desfeita e você perderá todos os seus livros e progresso.");
    
    if (confirm) {
      try {
        // Chama a função SQL que criamos
        const { error } = await supabase.rpc('delete_own_user');
        if (error) throw error;

        await logout();
        toast.success("Sua conta foi excluída. Sentiremos sua falta!");
        navigate('/');
      } catch (error) {
        console.error(error);
        toast.error("Erro ao excluir conta: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Cabeçalho com Avatar */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-500">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            
            {/* Botão da Câmera */}
            <label className="absolute bottom-0 right-0 bg-[#FF0864] hover:bg-[#D10050] text-white p-2 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Camera className="w-5 h-5" />}
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-500">{formData.email}</p>
          </div>
        </div>

        {/* Card de Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600"/>
                Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize como você aparece na comunidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label>Nome de Usuário / Apelido</Label>
              <Input 
                value={formData.nickname} 
                onChange={e => setFormData({...formData, nickname: e.target.value})}
                placeholder="Como quer ser chamado nos comentários"
              />
              <p className="text-xs text-gray-500">Este nome aparecerá nos seus comentários.</p>
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  value={formData.email} 
                  disabled 
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">O e-mail não pode ser alterado por segurança.</p>
            </div>

            <Button 
                onClick={handleSave} 
                disabled={loading} 
                className="w-full bg-[#FF0864] hover:bg-[#D10050] text-white mt-4"
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Zona de Perigo */}
        <Card className="border-red-100 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5"/>
                Zona de Perigo
            </CardTitle>
            <CardDescription className="text-red-600/80">
                Ações irreversíveis para sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="w-full bg-red-600 hover:bg-red-700"
            >
                <Trash2 className="w-4 h-4 mr-2"/>
                Excluir Minha Conta
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
            <Button variant="ghost" onClick={logout} className="text-gray-500 hover:text-gray-800">
                <LogOut className="w-4 h-4 mr-2"/> Sair da conta
            </Button>
        </div>

      </div>
    </div>
  );
}