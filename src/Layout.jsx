import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { createPageUrl } from '@/utils';
import UserMenu from './components/user/UserMenu';
import NotificationBell from './components/user/NotificationBell';
import GeoBlock from './components/GeoBlock';
import { useAuth } from '@/lib/AuthContext'; // Importando o cérebro novo

import { Library, Search, X, HelpCircle } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Layout({ children, currentPageName }) {
  const { user, loading } = useAuth(); // Pega o usuário do Supabase
  const navigate = useNavigate(); 
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Microsoft Clarity - Adaptado para o Supabase
  useEffect(() => {
    if (loading) return; // Espera carregar o login

    const EXCLUDED_EMAILS = [
      'anabeatriz17371@gmail.com',
      'isaduarte.design@gmail.com',
      'isadefigueredo@icloud.com'
    ];

    // Verifica se é Admin ou email excluído
    if (user?.isAdmin || (user?.email && EXCLUDED_EMAILS.includes(user.email))) {
      console.log('[Clarity] Tracking bloqueado para admin/email excluído');
      return;
    }

    // Carrega Clarity normalmente
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "v1excrlaa4");
  }, [user, loading]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl('Home') + `?search=${encodeURIComponent(searchQuery)}`;
    }
  };

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
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <Link 
            to={createPageUrl('Home')} 
            className="flex items-center"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691c6c1cde63ef302dc8df55/2e5689945_logoromancenobolso.png" 
              alt="Romance no Bolso" 
              className="h-12 md:h-14"
            />
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Buscar livros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 md:w-64 h-9 text-sm"
                  autoFocus
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hover:bg-[#FFE5EE] text-[#3065DF]"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {user ? (
                <>
                  <Link to={createPageUrl('MyBooks')}>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#FFE5EE] text-[#3065DF] h-9">
                      <Library className="w-5 h-5" />
                      <span className="hidden sm:inline">Meus Livros</span>
                    </Button>
                  </Link>
                  <NotificationBell userEmail={user.email} />
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  <Link to={createPageUrl('Support')}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-[#FFE5EE] text-[#3065DF]">
                      <HelpCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                  {currentPageName === 'Home' && (
                    <Button
                      onClick={() => navigate('/login')}
                      className="bg-[#FF0864] hover:bg-[#D10050] h-9"
                    >
                      Entrar
                    </Button>
                  )}
                </>
              )}
          </div>
        </div>
      </header>
      
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      </div>
    </GeoBlock>
      );
}