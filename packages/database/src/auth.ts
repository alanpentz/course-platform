import { createSupabaseClient } from './client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: 'student' | 'instructor' | 'admin';
}

export const signIn = async (email: string, password: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const supabase = createSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const supabase = createSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  return session;
};

export const getUser = async () => {
  const supabase = createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user as AuthUser | null;
};

export const refreshSession = async () => {
  const supabase = createSupabaseClient();
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) throw error;
  return session;
};

export const signInWithGoogle = async () => {
  const supabase = createSupabaseClient();
  
  // Use the correct origin for the callback
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) throw error;
  return data;
};

export const signInWithProvider = async (provider: 'google' | 'github' | 'azure') => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};