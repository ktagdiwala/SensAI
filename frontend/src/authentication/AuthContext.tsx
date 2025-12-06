import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

type Role = 'Instructor' | 'Student';
type AuthUser = { id: number; role: Role } | null;

type AuthContextValue = {
  user: AuthUser;
  setUser: React.Dispatch<React.SetStateAction<AuthUser>>;
};

const normalizeRole = (role: unknown): Role | null => {
  if (role === 'Instructor' || role === 'Student') return role;
  if (role === 'instructor') return 'Instructor';
  if (role === 'student') return 'Student';
  return null;
};

const readPersistedUser = (): AuthUser => {
  const storedId = localStorage.getItem('userId');
  const storedRole = normalizeRole(localStorage.getItem('userRole'));
  return storedId && storedRole ? { id: Number(storedId), role: storedRole } : null;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(readPersistedUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem('userId', String(user.id));
      localStorage.setItem('userRole', user.role);
    } else {
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSession() {
      try {
        const res = await fetch('http://localhost:3000/api/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await res.json();
        const normalizedRole = normalizeRole(data.role);
        if (!cancelled) {
          normalizedRole ? setUser({ id: data.userId, role: normalizedRole }) : setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    hydrateFromSession();
    return () => {
      cancelled = true;
    };
  }, []);

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