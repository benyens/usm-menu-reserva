import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  employee_id: string;
  department: string | null;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user credentials for auto-login
const DEMO_USER = {
  email: 'juan.perez@usm.cl',
  password: 'demo123456',
  full_name: 'Juan Pérez González',
  employee_id: 'USM2024001',
  department: 'Informática'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Auto-login demo user
    const autoLogin = async () => {
      // Check for existing session first
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', existingSession.user.id)
          .single();
        
        setProfile(profileData);
        setLoading(false);
        return;
      }

      // Try to sign in with demo credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
      });

      if (signInError) {
        // If sign in fails, try to create the demo user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: DEMO_USER.email,
          password: DEMO_USER.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: DEMO_USER.full_name,
              employee_id: DEMO_USER.employee_id,
              department: DEMO_USER.department
            }
          }
        });

        if (signUpData.user && !signUpError) {
          // Create profile for the new user
          await supabase
            .from('profiles')
            .insert({
              user_id: signUpData.user.id,
              email: DEMO_USER.email,
              full_name: DEMO_USER.full_name,
              employee_id: DEMO_USER.employee_id,
              department: DEMO_USER.department
            });
        }
      }
    };

    autoLogin();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};