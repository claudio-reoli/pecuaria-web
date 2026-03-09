import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) return;
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
      const text = await res.text();
      const u = text ? JSON.parse(text) : null;
      if (res.ok && u) {
        setUser(u);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está rodando.');
    }
    const text = await res.text();
    let data: { token?: string; user?: User; error?: string } = {};
    try {
      if (text) data = JSON.parse(text);
    } catch {
      const hint = res.status >= 500 ? 'O servidor pode estar instável.' : '';
      throw new Error(`Resposta inválida do servidor. ${hint} Verifique se o backend está rodando.`.trim());
    }
    if (!res.ok) throw new Error(data.error || `Erro ao fazer login (${res.status})`);
    if (!data.token || !data.user) throw new Error('Resposta inválida do servidor.');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
