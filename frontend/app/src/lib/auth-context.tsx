import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "./api-client";

export interface UserSession {
  userId: string;
  registryId?: string;
  role: "council" | "registry" | "viewer";
  token: string;
}

interface AuthContextType {
  session: UserSession | null;
  login: (session: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("clear_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        apiClient.setToken(parsed.token);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (newSession: UserSession) => {
    setSession(newSession);
    apiClient.setToken(newSession.token);
    localStorage.setItem("clear_session", JSON.stringify(newSession));
  };

  const logout = () => {
    setSession(null);
    apiClient.setToken(null);
    localStorage.removeItem("clear_session");
  };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
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
