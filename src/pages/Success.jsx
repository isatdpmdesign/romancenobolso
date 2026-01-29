import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen } from 'lucide-react';

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
              marginBottom: '24px',
              border: '1px solid #30A920'
            }}>
              <p style={{ fontSize: '15px', color: '#198D02', fontWeight: 'bold', marginBottom: '12px' }}>
                ➡️ Próximos passos:
              </p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0', lineHeight: '1.5' }}>1. Acesse o e-mail cadastrado na compra.</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0', lineHeight: '1.5' }}>2. Procure pelo assunto: <b>&quot;Seu acesso ao livro foi desbloqueado!&quot;</b></p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0', lineHeight: '1.5' }}>3. Abra a mensagem para pegar seu login e senha de acesso.</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '12px 0 8px', lineHeight: '1.5' }}>⚠️ <b>Importante:</b> Se não encontrar, verifique sua caixa de <b>SPAM</b> e marque o <b>Romance no Bolso</b> como &quot;Não é lixo spam&quot;.</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '8px 0', lineHeight: '1.5' }}>4. Use seu login e senha de acesso para entrar no site. <b>Clique na capa do livro que você estava lendo e pronto!</b> Todos os capítulos já estarão liberados para você aproveitar!</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent', 
                    color: '#FF0864', 
                    padding: '14px 18px', 
                    borderRadius: '16px', 
                    border: '2px solid #FF0864',
                    fontWeight: 'bold', 
                    fontSize: '15px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  Abrir Gmail
                </a>
                <a
                  href="https://outlook.live.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent', 
                    color: '#FF0864', 
                    padding: '14px 18px', 
                    borderRadius: '16px', 
                    border: '2px solid #FF0864',
                    fontWeight: 'bold', 
                    fontSize: '15px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  Abrir Outlook
                </a>
              </div>
              <button 
                onClick={() => navigate('/')}
                style={{ 
                  width: '100%',
                  backgroundColor: 'rgba(59, 130, 246, 1)', 
                  color: 'white', 
                  padding: '14px 18px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(0, 0, 0, 1)',
                  fontWeight: 'bold', 
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Voltar para o site
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}