import type { AuthUser } from "@shin-blog-app/shared";
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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
            email: payload.email as string,
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

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      const result = await amplifySignIn({
        username: email,
        password,
        options: { authFlowType: "USER_PASSWORD_AUTH" },
      });
      if (result.isSignedIn) {
        const session = await fetchAuthSession();
        const currentUser = await getCurrentUser();
        const payload = session.tokens?.idToken?.payload;
        setUser({
          sub: currentUser.userId,
          email: payload?.email as string,
        });
      }
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await amplifySignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
