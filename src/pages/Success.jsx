import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen, CheckCircle } from 'lucide-react';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Pegamos o ID do livro que o Stripe deve enviar na URL (ex: ?bookId=123)
  const bookId = searchParams.get('bookId');

  const handleAction = () => {
    if (user && bookId) {
      // Se está logado, vai direto para os detalhes do livro para ler
      navigate(`/BookDetails?id=${bookId}`);
    } else {
      // Se for novo, volta para a home para seguir o fluxo do e-mail
      navigate('/');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      fontFamily: 'sans-serif',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ 
        maxWidth: '480px', 
        width: '100%', 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '32px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
        
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '15px', color: '#198D02' }}>
          Pagamento Confirmado!
        </h1>

        {user ? (
          /* CLIENTE LOGADO */
          <>
            <p style={{ color: '#4b5563', fontSize: '17px', marginBottom: '30px', lineHeight: '1.6' }}>
              Parabéns! O acesso completo ao livro já foi liberado na sua conta <b>{user.email}</b>.
            </p>

            <button 
              onClick={handleAction} 
              style={{ 
                width: '100%',
                backgroundColor: '#8b5cf6', 
                color: 'white', 
                padding: '18px', 
                borderRadius: '16px', 
                border: 'none',
                fontWeight: 'bold', 
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <BookOpen size={20} />
              Continuar para o Livro
            </button>
          </>
        ) : (
          /* CLIENTE NOVO */
          <>
            <p style={{ color: '#4b5563', fontSize: '16px', marginBottom: '25px' }}>
              Seu acesso foi enviado para o e-mail cadastrado no <b>Stripe</b>.
            </p>

            <div style={{ 
              textAlign: 'left', 
              backgroundColor: '#E2FFDE', 
              padding: '20px', 
              borderRadius: '20px', 
              marginBottom: '30px',
              border: '1px solid #30A920'
            }}>
              <p style={{ fontSize: '15px', color: '#198D02', fontWeight: 'bold', marginBottom: '12px' }}>
                ➡️ Próximos passos:
              </p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0' }}>1. Acesse seu e-mail de compra.</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0' }}>2. Procure por: <b>"Seu livro chegou! 📖"</b></p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0' }}>3. Lá você encontrará seu <b>login, senha</b> e o <b>link exclusivo</b> para desbloquear todos os capítulos.</p>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              style={{ 
                width: '100%',
                backgroundColor: '#198D02', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '16px', 
                border: 'none',
                fontWeight: 'bold', 
                cursor: 'pointer'
              }}
            >
              Voltar ao Início
            </button>
          </>
        )}
      </div>
    </div>
  );
}