import React from 'react';
import { CreditCard, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { biblioteca } from '@/data/livros'; 

export default function PaymentForm({ book }) {
  // 1. Pega o ID
  const bookId = book?.id || book?._id;
  const displayPrice = book?.price || "R$ 6,90"; 

  // 2. Procura o link AGORA (antes mesmo de desenhar a tela)
  const dadosLivro = biblioteca[bookId];
  const linkDestino = dadosLivro?.linkStripe;

  // Debug: Se quiser ver no console se achou o link
  console.log("ID do Livro:", bookId);
  console.log("Link Encontrado:", linkDestino);

  return (
    <div className="w-full relative">
      
      {/* Bloco de Informações do Livro */}
      <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-xl p-6 mb-6 shadow-sm">
        <div className="text-center">
          <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-pink-500" />
          </div>
          <h3 className="text-gray-900 font-semibold text-lg">Desbloquear Capítulo Completo</h3>
          <p className="text-gray-500 text-sm mt-1">
            Você está adquirindo: <br/>
            <span className="font-bold text-pink-600">{book?.title || "Este Livro"}</span>
          </p>
          <div className="mt-4 text-3xl font-bold text-gray-900">
            {displayPrice}
          </div>
        </div>
      </div>

      {/* A MÁGICA: Link Direto (Anchor Tag) */}
      {linkDestino ? (
        <a 
          href={linkDestino} 
          className="block w-full transform transition-all hover:scale-[1.02] hover:-translate-y-1"
          style={{ textDecoration: 'none' }} // Tira o sublinhado feio de link
        >
          <button 
            className="w-full bg-[#635BFF] hover:bg-[#534bda] text-white font-bold py-6 text-lg rounded-xl shadow-lg flex items-center justify-center gap-3 cursor-pointer"
            style={{ pointerEvents: 'none' }} // O clique passa pelo botão e atinge o Link 'a'
          >
            <CreditCard className="w-5 h-5" />
            Finalizar Compra
          </button>
        </a>
      ) : (
        /* Se não tiver link configurado, mostra botão cinza de erro */
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-yellow-800 font-bold mb-2">Link não configurado!</p>
          <p className="text-xs text-gray-600 break-all select-all font-mono bg-white p-2 rounded border">
            ID: {bookId}
          </p>
          <p className="text-xs text-gray-500 mt-2">Copie este ID para o arquivo livros.js</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Pagamento 100% seguro via Stripe</span>
      </div>
    </div>
  );
}