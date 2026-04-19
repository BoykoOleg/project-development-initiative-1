import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getApiUrl } from "@/lib/api";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "employee";
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => "Не инициализировано",
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const authUrl = getApiUrl("auth");

  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    if (!saved) {
      setLoading(false);
      return;
    }
    fetch(`${authUrl}?action=me`, {
      headers: { "X-Auth-Token": saved },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setToken(saved);
          setUser(data);
        } else {
          localStorage.removeItem("auth_token");
        }
      })
      .catch(() => localStorage.removeItem("auth_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const res = await fetch(`${authUrl}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Ошибка входа";
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return null;
  };

  const logout = () => {
    const t = token;
    if (t) {
      fetch(`${authUrl}?action=logout`, {
        method: "POST",
        headers: { "X-Auth-Token": t },
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function authHeaders(token: string | null): HeadersInit {
  return token ? { "X-Auth-Token": token } : {};
}
