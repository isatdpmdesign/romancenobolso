import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookOpen, CheckCircle } from 'lucide-react';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Pegamos o ID do livro que o Stripe deve enviar na URL (ex: ?bookId=123)
  const bookId = searchParams.get('bookId');

  // Buscar o último capítulo que o usuário estava lendo
  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.id, bookId],
    queryFn: async () => {
      if (!user?.id || !bookId) return null;
      const { data } = await supabase
        .from('user_progress')
        .select('last_chapter_id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!bookId
  });

  const handleAction = () => {
    if (user && bookId) {
      // Se o usuário estava lendo um capítulo específico, vai direto para ele
      if (userProgress?.last_chapter_id) {
        navigate(`/Reader?bookId=${bookId}&chapterId=${userProgress.last_chapter_id}`);
      } else {
        // Caso contrário, vai para os detalhes do livro
        navigate(`/BookDetails?id=${bookId}`);
      }
    } else {
      // Se for novo, volta para a home para seguir o fluxo do e-mail
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f9fafb]">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-lg text-center">
        <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">✅</div>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-[#198D02]">
          Pagamento Confirmado!
        </h1>

        {user ? (
          /* CLIENTE LOGADO */
          <>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed px-2">
              Parabéns! O acesso completo ao livro já foi liberado na sua conta <b className="break-all">{user.email}</b>.
            </p>

            <button 
              onClick={handleAction} 
              className="w-full bg-[#3065DF] hover:bg-[#1E4BB8] active:bg-[#1E4BB8] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.98] shadow-lg"
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Continuar para o Livro</span>
            </button>
          </>
        ) : (
          /* CLIENTE NOVO */
          <>
            <p className="text-gray-600 text-sm sm:text-base mb-5 sm:mb-6 px-2">
              Seu acesso foi enviado para o e-mail cadastrado no <b>Stripe</b>.
            </p>

            <div className="text-left bg-[#E2FFDE] p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 border border-[#30A920]">
              <p className="text-base sm:text-lg text-[#198D02] font-bold mb-3 sm:mb-4">
                ➡️ Próximos passos:
              </p>
              <p className="text-sm sm:text-base text-gray-700 mb-2.5 sm:mb-3 leading-relaxed">1. Acesse seu e-mail de compra.</p>
              <p className="text-sm sm:text-base text-gray-700 mb-2.5 sm:mb-3 leading-relaxed">2. Procure por: <b>"Seu livro chegou! 📖"</b></p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">3. Lá você encontrará seu <b>login, senha</b> e o <b>link exclusivo</b> para desbloquear todos os capítulos.</p>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-[#198D02] hover:bg-[#157A02] active:bg-[#157A02] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all active:scale-[0.98] shadow-lg"
            >
              Voltar ao Início
            </button>
          </>
        )}
      </div>
    </div>
  );
}