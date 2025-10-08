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
      // Try to restore session from localStorage if available
      if (typeof window !== "undefined") {
        const sessionSecret = localStorage.getItem("cookieFallback");
        console.log("sessionSecret", sessionSecret);
        // session secret is like {"a_session_68c4f57f002d57cb79c0":"eyJpZCI6IjY4ZDNhYzU4OGUxZjFmNWU1NWNjIiwic2VjcmV0IjoiY2YyNmJjMmI5ZmFlN2EyOTJjMmJmMTlmMTk4ZjdjNzgzMzJlOTVlOWQ4YzZlYTkwZTBhZGRkYjUxM2RmODgyN2IzNzlhNzg1YjY3YTU1MmU2YmFlNjZmNWYzMmNmNGRlYzgzM2M2OTdjOTM4YWI2NmM0MWMxNmVhYjlhNzU4M2JmZWE4Mzc5MDlhM2JhODA3YWExOWNlZThhZmY2MGU0NjljMjZmYzczYzA0MmNlMDg0MWYxMzU5NTgzNjMyZTJkMDM2YjQ4Y2JlOTA4NGI1ZDllMjQ2MjM4NjI4ODRhM2MzOTg4YWYzYzI1OGNhY2JmZjBiODc3NDZlMjU4NDNhNCJ9"}
        // so we need to extract the string
        const sessionSecretString = sessionSecret.split(":")[1].split('"')[1];
        if (sessionSecret) {
          setClientSession(sessionSecretString);
        }
      }
      
      const userData = await account.get();
      setUser(userData);
    } catch (error) {
      setUser(null);
      // Clear invalid session
      clearClientSession();
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
