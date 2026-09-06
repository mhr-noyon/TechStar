import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("techstar_token") || null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem("techstar_token");
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await apiRequest("/auth/me");
        setUser(userData);
      } catch (err) {
        console.warn("Token validation failed:", err.message);
        localStorage.removeItem("techstar_token");
        localStorage.removeItem("techstar_refresh_token");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { user: userData, accessToken, refreshToken } = res;
    localStorage.setItem("techstar_token", accessToken);
    localStorage.setItem("techstar_refresh_token", refreshToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("techstar_refresh_token");
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      // ignore logout API failures
    } finally {
      localStorage.removeItem("techstar_token");
      localStorage.removeItem("techstar_refresh_token");
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
