import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Book, ArrowLeft } from 'lucide-react';

export default function MyBooks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyBooks() {
      // Se não tiver usuário logado, para por aqui
      if (!user || !user.email) {
        setLoading(false);
        return;
      }
      
      try {
        // 1. Buscamos na tabela 'user_books' usando o e-mail do usuário
        // 2. Trazemos os dados da tabela vinculada 'livros'
        const { data, error } = await await supabase
          .from('user_books') 
          .select(`
            *,
            livros (
              id,
              title,
              cover_url
            )
          `)
          .eq('user_id', user.email); // Agora filtramos pelo e-mail salvo pelo Make

        if (error) throw error;

        if (data) {
          // Extraímos apenas os dados dos livros da resposta
          const myBooks = data
            .map(item => item.livros)
            .filter(book => book !== null); // Remove qualquer erro de vínculo vazio
          
          setBooks(myBooks);
        }
      } catch (err) {
        console.error('Erro ao carregar livros:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMyBooks();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fd]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando sua biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fd] p-4 md:p-8">
      {/* Cabeçalho com botão Voltar */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 hover:bg-white rounded-full transition-all shadow-sm flex items-center gap-2 px-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-gray-600 font-medium">Voltar para a Home</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0f172a] mb-8">Meus Livros</h1>

        {books.length === 0 ? (
          /* Estado Vazio - Seguindo seu layout antigo */
          <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-purple-50 p-6 rounded-full text-[#8b5cf6] mb-6">
              <Book size={60} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sua estante está vazia</h2>
            <p className="text-gray-500 mb-8 max-w-sm text-lg">
              Você ainda não adquiriu nenhum romance. Que tal começar uma nova história hoje?
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-200 active:scale-95"
            >
              Explorar Livros
            </button>
          </div>
        ) : (
          /* Lista de Livros Comprados */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {books.map((book) => (
              <div 
                key={book.id} 
                onClick={() => navigate(`/BookDetails?id=${book.id}`)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300">
                  <img 
                    src={book.cover_url} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                      Ler Agora
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-bold text-gray-800 line-clamp-2 text-lg group-hover:text-[#8b5cf6] transition-colors">
                  {book.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}