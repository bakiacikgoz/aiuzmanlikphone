import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router, useSegments } from 'expo-router';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { formatAcademyError } from '../lib/academyApi';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicRoutes = new Set(['index', 'auth', 'placement-intro', 'placement-question', 'interests', 'level-result']);

export function AuthProvider({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(formatAcademyError(sessionError));
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return;

    const route = segments[0] ?? 'index';
    const isPublic = publicRoutes.has(route);

    if (!session && !isPublic) {
      router.replace('/auth');
    }
  }, [loading, segments, session]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase anon key .env icinde ayarlanmali.');
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) throw new Error(formatAcademyError(signInError));
    router.replace('/dashboard');
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase anon key .env icinde ayarlanmali.');
      return;
    }
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: email.split('@')[0] } },
    });
    if (signUpError) throw new Error(formatAcademyError(signUpError));
    router.replace('/interests');
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase anon key .env icinde ayarlanmali.');
      return;
    }
    const redirectTo = Linking.createURL('/dashboard');
    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (googleError) throw new Error(formatAcademyError(googleError));
    if (data.url) {
      const canOpen = await Linking.canOpenURL(data.url);
      if (canOpen) await Linking.openURL(data.url);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    router.replace('/auth');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null),
    }),
    [error, loading, session, signInWithEmail, signInWithGoogle, signOut, signUpWithEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
