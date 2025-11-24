import { createContext, useState, useContext, useEffect } from 'react';

type AuthUser = { id: number; role: 'Instructor' | 'Student' } | null;

type AuthContextValue = {
  user: AuthUser;
  setUser: React.Dispatch<React.SetStateAction<AuthUser>>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(() => {
    const storedId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('userRole');
    if (storedId && (storedRole === 'Instructor' || storedRole === 'Student')) {
      return { id: Number(storedId), role: storedRole };
    }
    return null;
  });

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSession() {
      try {
        const res = await fetch('http://localhost:3000/api/me', {
          credentials: 'include',
        });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setUser({ id: data.userId, role: data.role });
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    hydrateFromSession();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}