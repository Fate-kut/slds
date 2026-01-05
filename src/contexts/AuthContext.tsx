/**
 * Authentication Context Provider
 * Manages Supabase authentication state with offline support
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, CachedAuth } from '@/lib/offline/indexedDB';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  locker_id: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isOffline: boolean;
  isOfflineAuth: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; isOffline?: boolean }>;
  signUp: (email: string, password: string, username: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isOfflineAuth, setIsOfflineAuth] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache auth data for offline use
  const cacheAuthData = useCallback(async (email: string, passwordHash: string, userProfile: UserProfile) => {
    try {
      const cachedAuth: CachedAuth = {
        id: userProfile.id,
        email,
        passwordHash,
        profile: userProfile,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      await offlineDB.cacheAuth(cachedAuth);
    } catch (error) {
      console.error('Error caching auth:', error);
    }
  }, []);

  // Simple hash for offline password verification (not cryptographically secure, but sufficient for offline cache)
  const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  // Fetch user profile and role
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      if (!profileData) {
        return null;
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
        return null;
      }

      const userProfile: UserProfile = {
        id: profileData.id,
        username: profileData.username,
        name: profileData.name,
        locker_id: profileData.locker_id,
        role: (roleData?.role as UserRole) || 'student',
      };

      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserProfile(existingSession.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; isOffline?: boolean }> => {
    const passwordHash = hashPassword(password);

    // Try online authentication first
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Cache auth for offline use after successful login
        if (data.user) {
          const userProfile = await fetchUserProfile(data.user.id);
          if (userProfile) {
            await cacheAuthData(email, passwordHash, userProfile);
          }
        }

        setIsOfflineAuth(false);
        return { success: true };
      } catch (error) {
        // Network error - try offline auth
        console.log('Network error, trying offline auth...');
      }
    }

    // Try offline authentication
    try {
      const cachedAuth = await offlineDB.getCachedAuth(email);
      
      if (!cachedAuth) {
        return { 
          success: false, 
          error: 'No cached credentials found. Please connect to the internet to log in.' 
        };
      }

      // Check if cache expired
      if (new Date() > new Date(cachedAuth.expiresAt)) {
        await offlineDB.clearAuthCache();
        return { 
          success: false, 
          error: 'Cached credentials expired. Please connect to the internet to log in.' 
        };
      }

      // Verify password hash
      if (cachedAuth.passwordHash !== passwordHash) {
        return { success: false, error: 'Invalid password' };
      }

      // Set offline auth state
      setProfile(cachedAuth.profile);
      setIsOfflineAuth(true);
      
      return { success: true, isOffline: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }, [fetchUserProfile, cacheAuthData]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    username: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            name,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isOfflineAuth) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsOfflineAuth(false);
  }, [isOfflineAuth]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isOffline,
    isOfflineAuth,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
