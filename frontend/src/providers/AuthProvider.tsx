'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { apiClient } from '@/lib/api';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
});

import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  useEffect(() => {
    let mounted = true;

    async function fetchRole(currentSession: Session | null) {
      if (!currentSession) {
        if (mounted) {
          setRole(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const response = await apiClient('/rbac/me');
        if (response.ok) {
          const data = await response.json();
          if (mounted && data.role) {
            setRole(data.role);
          } else {
            if (mounted) setRole(null);
          }
        } else {
          if (mounted) setRole(null);
        }
      } catch (err) {
        if (mounted) setRole(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        fetchRole(initialSession);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setIsLoading(true);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          fetchRole(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
