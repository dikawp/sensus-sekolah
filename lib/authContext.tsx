'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState, UserRole } from './types';
import { createClient } from './supabase/client';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          schoolName: data.school_name,
          createdAt: data.created_at,
          active: data.active
        });
      }
      setIsLoading(false);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return error.message;
    }
    return null; // The onAuthStateChange will handle fetching user profile
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
