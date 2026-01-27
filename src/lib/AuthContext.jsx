import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "isaduarte.design@gmail.com"; 

  useEffect(() => {
    // 1. O onAuthStateChange do Supabase é muito rápido e já lida com a sessão inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          ...session.user,
          isAdmin: session.user.email === ADMIN_EMAIL
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAdmin: user?.isAdmin }}>
      {/* MUDANÇA PARA PERFORMANCE: 
          Retiramos o {!loading && children}. 
          Agora o site renderiza os esqueletos cinzas (skeletons) IMEDIATAMENTE, 
          enquanto o login é processado em milissegundos.
      */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);