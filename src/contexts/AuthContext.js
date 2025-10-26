"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { resetCrispSession } from "@/components/CrispChat";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check initial session
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error("Auth error:", error);
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
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Reset Crisp session
      resetCrispSession();
      
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, sign out from Supabase
      await supabase.auth.signOut();
      
      // Reset Crisp session
      resetCrispSession();
      
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
