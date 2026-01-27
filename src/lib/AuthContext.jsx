import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seu e-mail de Admin
  const ADMIN_EMAIL = "isaduarte.design@gmail.com"; 

  useEffect(() => {
    // 1. Verifica login inicial
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            ...session.user,
            isAdmin: session.user.email === ADMIN_EMAIL
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Ouve mudanças (Login/Logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAdmin: user?.isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// --- ESSA É A LINHA QUE ESTAVA FALTANDO OU QUEBRADA ---
export const useAuth = () => useContext(AuthContext);