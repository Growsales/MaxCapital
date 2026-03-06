import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { mockProfiles, MOCK_USER_ID_EXPORT } from '@/lib/mock-data';

// Mock User type (mimics Supabase User)
interface MockUser {
  id: string;
  email: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
  created_at: string;
  role: string;
}

interface AuthContextType {
  user: MockUser | null;
  profile: any | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, nome: string, tipo?: string) => Promise<MockUser | null>;
  signOut: () => Promise<void>;
  switchProfileType: (tipo: 'parceiro' | 'empresa' | 'investidor' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const profilesByType: Record<string, any> = {
  parceiro: mockProfiles.find(p => p.tipo === 'parceiro') || mockProfiles[0],
  empresa: mockProfiles.find(p => p.tipo === 'empresa') || mockProfiles[1],
  investidor: mockProfiles.find(p => p.tipo === 'investidor') || mockProfiles[2],
  admin: { ...mockProfiles[0], tipo: 'admin', nome: 'Admin Master', email: 'admin@maxcapital.com.br' },
};

function makeUserFromProfile(profile: any): MockUser {
  return {
    id: profile.id,
    email: profile.email,
    app_metadata: {},
    user_metadata: { nome: profile.nome, tipo: profile.tipo },
    aud: 'authenticated',
    created_at: profile.created_at,
    role: 'authenticated',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState(profilesByType.parceiro);
  const [currentUser, setCurrentUser] = useState<MockUser>(makeUserFromProfile(profilesByType.parceiro));

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const switchProfileType = (tipo: 'parceiro' | 'empresa' | 'investidor' | 'admin') => {
    const profile = profilesByType[tipo];
    setCurrentProfile(profile);
    setCurrentUser(makeUserFromProfile(profile));
  };

  const signIn = async (_email: string, _password: string) => {
    console.log('[Mock] Sign in');
  };

  const signInWithGoogle = async () => {
    console.log('[Mock] Sign in with Google');
  };

  const signUp = async (
    _email: string,
    _password: string,
    _nome: string,
    _tipo: string = 'parceiro'
  ): Promise<MockUser | null> => {
    console.log('[Mock] Sign up');
    return currentUser;
  };

  const signOut = async () => {
    console.log('[Mock] Sign out');
  };

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      profile: currentProfile,
      session: { access_token: 'mock-token', user: currentUser },
      isLoading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      switchProfileType,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}