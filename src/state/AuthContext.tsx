import {
  createContext,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/client";
import type { User } from "../types";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("preproute_token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("preproute_user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const login = useCallback(async (userId: string, password: string) => {
    const data = await authApi.login(userId, password);
    localStorage.setItem("preproute_token", data.token);
    localStorage.setItem("preproute_user", JSON.stringify(data.user ?? { userId }));
    setToken(data.token);
    setUser(data.user ?? { userId });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("preproute_token");
    localStorage.removeItem("preproute_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
    [login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
