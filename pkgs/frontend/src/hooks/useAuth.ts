import { useState, useEffect } from 'react';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';
import type { AuthUser } from '@shin-blog-app/shared';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await fetchAuthSession();
        if (session.tokens?.idToken) {
          const currentUser = await getCurrentUser();
          const payload = session.tokens.idToken.payload;
          setUser({
            sub: currentUser.userId,
            email: payload['email'] as string,
          });
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void restoreSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const result = await amplifySignIn({ username: email, password });
    if (result.isSignedIn) {
      const session = await fetchAuthSession();
      const currentUser = await getCurrentUser();
      const payload = session.tokens?.idToken?.payload;
      setUser({
        sub: currentUser.userId,
        email: payload?.['email'] as string,
      });
    }
  };

  const signOut = async (): Promise<void> => {
    await amplifySignOut();
    setUser(null);
  };

  return { user, isLoading, signIn, signOut };
}
