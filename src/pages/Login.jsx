import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // Estado para mensagens de erro visíveis
  const [successMsg, setSuccessMsg] = useState(''); // Estado para sucesso

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // Limpa mensagens ao trocar entre Login/Cadastro
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({ email: '', password: '', fullName: '' });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Validação Básica no Front-end (Feedback Imediato)
    if (isSignUp) {
        if (formData.password.length < 6) {
            setErrorMsg("A senha precisa ter no mínimo 6 caracteres.");
            setLoading(false);
            return;
        }
        if (!formData.fullName.trim()) {
            setErrorMsg("Por favor, digite seu nome.");
            setLoading(false);
            return;
        }
    }

    try {
      if (isSignUp) {
        // --- CADASTRO ---
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName },
          },
        });

        if (error) throw error;

        // Sucesso no cadastro
        setSuccessMsg("Conta criada com sucesso! Entrando...");
        toast.success("Bem-vindo(a) ao clube!");
        
        // Pequeno delay para o usuário ler a mensagem antes de redirecionar
        setTimeout(() => {
            // Se o 'Confirm Email' estiver desligado, ele já loga direto
            if (data.session) navigate('/');
        }, 1500);

      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        
        toast.success("Login realizado!");
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      
      // Tradução de erros comuns do Supabase
      let msg = error.message;
      if (msg.includes("Invalid login credentials")) msg = "E-mail ou senha incorretos.";
      if (msg.includes("User already registered")) msg = "Este e-mail já possui uma conta. Tente fazer login.";
      if (msg.includes("Password should be at least")) msg = "A senha precisa ter pelo menos 6 caracteres.";
      
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8FA] via-[#E8EEFB] to-[#FFF8FA] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-50">
        
        {/* Cabeçalho */}
        <div className="bg-white p-8 pb-4 text-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691c6c1cde63ef302dc8df55/2e5689945_logoromancenobolso.png" 
            alt="Romance no Bolso" 
            className="h-12 mx-auto mb-6 opacity-90"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? "Junte-se a nós" : "Bem-vindo de volta"}
          </h2>
          <p className="text-gray-500 text-sm">
            {isSignUp 
              ? "Crie sua conta gratuita para começar a ler." 
              : "Digite seus dados para acessar sua estante."}
          </p>
        </div>

        {/* Área de Feedback (Erros/Sucesso) */}
        {errorMsg && (
            <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
            </div>
        )}
        {successMsg && (
            <div className="mx-8 mb-4 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {successMsg}
            </div>
        )}

        {/* Formulário */}
        <div className="p-8 pt-2">
          <form onSubmit={handleAuth} className="space-y-4">
            
            {isSignUp && (
              <div className="space-y-2">
                <Label>Seu Nome</Label>
                <Input 
                  type="text" 
                  placeholder="Seu nome" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                />
              </div>
              
              {/* Dica de Senha (UX: Mostrar regras antes do erro) */}
              {isSignUp && (
                  <p className={`text-xs mt-1 transition-colors ${formData.password.length > 0 && formData.password.length < 6 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    * Mínimo de 6 caracteres
                  </p>
              )}
            </div>

            <Button 
              type="submit" 
              className={`w-full text-white py-6 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] mt-4 ${isSignUp ? 'bg-[#FF0864] hover:bg-[#D10050]' : 'bg-purple-600 hover:bg-purple-700'}`}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                <>Criar Conta Grátis <ArrowRight className="w-5 h-5 ml-2" /></>
              ) : (
                <>Entrar <LogIn className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </form>

          {/* Alternador */}
          <div className="mt-6 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-2">
              {isSignUp ? "Já tem conta?" : "Novo por aqui?"}
            </p>
            <Button 
              variant="ghost" 
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 font-medium"
              onClick={toggleMode}
            >
              {isSignUp ? "Fazer Login" : "Criar uma conta agora"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}