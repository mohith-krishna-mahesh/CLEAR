import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiClient } from "./api-client";

export type RoleType = "council" | "registry" | "viewer";

export interface UserSession {
  userId: string;
  registryId?: string;
  role: RoleType;
  token: string;
  name?: string;
  jurisdiction?: string;
  signerAddress?: string;
  tier?: "NONE" | "PENDING" | "OBSERVER" | "VERIFIED" | "REVOKED";
}

interface AuthContextType {
  session: UserSession | null;
  user: UserSession | null;
  registryId: string | undefined;
  role: RoleType | undefined;
  isAuthenticated: boolean;
  login: (session: UserSession) => void;
  logout: () => void;
  updateSession: (partial: Partial<UserSession>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "clear_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token) {
          apiClient.setToken(parsed.token);
          return parsed;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  });

  const login = useCallback((newSession: UserSession) => {
    setSession(newSession);
    apiClient.setToken(newSession.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateSession = useCallback((partial: Partial<UserSession>) => {
    setSession((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session || session.role !== "registry") return;
    try {
      const profile = (await apiClient.getProfile()) as any;
      if (profile && profile.registry) {
        updateSession({
          tier: profile.registry.tier || session.tier,
          name: profile.registry.name || session.name,
          jurisdiction: profile.registry.jurisdiction || session.jurisdiction,
          signerAddress:
            profile.registry.signerAddress || session.signerAddress,
        });
      }
    } catch (err) {
      console.warn("Failed to refresh profile:", err);
    }
  }, [session, updateSession]);

  useEffect(() => {
    if (session?.token) {
      apiClient.setToken(session.token);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session,
        registryId: session?.registryId,
        role: session?.role,
        isAuthenticated: !!session,
        login,
        logout,
        updateSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
