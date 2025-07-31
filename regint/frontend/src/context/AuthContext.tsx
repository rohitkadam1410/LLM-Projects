import React, { createContext, useContext, useState } from "react";

type User = { username: string; token: string };
type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    // Replace with real API call
    if (username && password) {
      setUser({ username, token: "dummy-token" });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const register = async (username: string, password: string) => {
    // Replace with real API call
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
