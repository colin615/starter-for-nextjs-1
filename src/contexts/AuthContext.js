"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account, setClientSession, clearClientSession } from "@/lib/appwrite";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {

      const userData = await account.get();
      setUser(userData);
    } catch (error) {
      setUser(null);
    
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the API route to clear server-side cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      // Clear client-side session
      clearClientSession();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, clear client session
      clearClientSession();
      setUser(null);
      router.push("/login");
    }
  };

  const value = {
    user,
    loading,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
