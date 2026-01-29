import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { createPageUrl } from '@/utils';
import UserMenu from './components/user/UserMenu';
import NotificationBell from './components/user/NotificationBell';
import GeoBlock from './components/GeoBlock';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

import { Library, Search, X, HelpCircle, BookOpen } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Layout({ children, currentPageName }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate(); 
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Buscar livros para autocomplete
  const { data: bookSuggestions = [] } = useQuery({
    queryKey: ['bookSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('livros')
        .select('id, titulo, autor, capa_vertical_url, capa_url')
        .or(`titulo.ilike.%${searchQuery}%,autor.ilike.%${searchQuery}%`)
        .limit(5);
      
      if (error) {
        console.error('Erro ao buscar livros:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: searchQuery.length >= 2 && showSearch,
    staleTime: 30000
  });

  // Microsoft Clarity - Adaptado para o Supabase
  useEffect(() => {
    if (loading) return;

    const EXCLUDED_EMAILS = [
      'anabeatriz17371@gmail.com',
      'isaduarte.design@gmail.com',
      'isadefigueredo@icloud.com'
    ];

    if (user?.isAdmin || (user?.email && EXCLUDED_EMAILS.includes(user.email))) {
      console.log('[Clarity] Tracking bloqueado para admin/email excluído');
      return;
    }

    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "v1excrlaa4");
  }, [user, loading]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      // Garantindo que a busca volte para a home com a barra inicial /
      window.location.href = createPageUrl('Home') + `?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSelectBook = (book) => {
    setSearchQuery(book.titulo);
    setShowSuggestions(false);
    window.location.href = createPageUrl('Home') + `?search=${encodeURIComponent(book.titulo)}`;
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || bookSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < bookSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectBook(bookSuggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearch]);

  // Mostrar sugestões quando houver resultados
  useEffect(() => {
    if (bookSuggestions.length > 0 && searchQuery.length >= 2) {
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [bookSuggestions, searchQuery]);

  return (
    <GeoBlock>
      <div className="min-h-screen">
        <style>{`
          :root {
            --color-primary: #3065DF;
            --color-secondary: #FF0864;
            --color-primary-light: #E8EEFB;
            --color-secondary-light: #FFE5EE;
            --color-primary-dark: #1E4BB8;
            --color-secondary-dark: #D10050;
            --color-neutral-warm: #FFF8FA;
          }
        `}</style>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center flex-shrink-0"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691c6c1cde63ef302dc8df55/2e5689945_logoromancenobolso.png" 
                alt="Romance no Bolso" 
                className="h-10 sm:h-12 md:h-14"
              />
            </Link>
            
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
              {/* Search */}
              {showSearch ? (
                <div className="relative flex-1 max-w-xs" ref={searchRef}>
                  <form onSubmit={handleSearch} className="flex items-center gap-1.5 sm:gap-2 w-full">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          if (bookSuggestions.length > 0 && searchQuery.length >= 2) {
                            setShowSuggestions(true);
                          }
                        }}
                        className="w-full h-8 sm:h-9 text-xs sm:text-sm pr-7 sm:pr-8"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setShowSuggestions(false);
                            setSelectedIndex(-1);
                          }}
                          className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:scale-95 touch-manipulation"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setShowSuggestions(false);
                        setSelectedIndex(-1);
                      }}
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </form>
                  
                  {/* Dropdown de Sugestões */}
                  {showSuggestions && bookSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto"
                    >
                      {bookSuggestions.map((book, index) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => handleSelectBook(book)}
                          className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left touch-manipulation ${
                            index === selectedIndex ? 'bg-gray-50' : ''
                          } ${index === 0 ? 'rounded-t-lg' : ''} ${
                            index === bookSuggestions.length - 1 ? 'rounded-b-lg' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden bg-gray-100">
                            {book.capa_vertical_url || book.capa_url ? (
                              <img
                                src={book.capa_vertical_url || book.capa_url}
                                alt={book.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {book.titulo}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                              {book.autor}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-[#FFE5EE] text-[#3065DF] flex-shrink-0 touch-manipulation"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}

              {user ? (
                  <>
                    {/* Adicionada a barra / antes do link para evitar erro 404 */}
                    <Link to="/MyBooks">
                      <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 hover:bg-[#FFE5EE] text-[#3065DF] h-8 sm:h-9 text-xs sm:text-sm touch-manipulation">
                        <Library className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Minha Estante</span>
                      </Button>
                    </Link>
                    <NotificationBell userEmail={user.email} />
                    <UserMenu user={user} />
                  </>
                ) : (
                  <>
                    <Link to="/Support">
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-[#FFE5EE] text-[#3065DF] touch-manipulation">
                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </Link>
                    {/* Botão Entrar agora é exibido em todas as páginas se deslogado */}
                    <Button
                      onClick={() => navigate('/login')}
                      className="bg-[#FF0864] hover:bg-[#D10050] h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 touch-manipulation active:scale-95"
                    >
                      Entrar
                    </Button>
                  </>
                )}
            </div>
          </div>
        </header>
        
        <main className="pt-14 sm:pt-16 min-h-screen">
          {children}
        </main>

      </div>
    </GeoBlock>
  );
}