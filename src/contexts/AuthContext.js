"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account, client } from "@/lib/appwrite";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClientAuthenticated, setIsClientAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const loginWithCredentials = async (email, password) => {
    try {
      // Authenticate directly with Appwrite using client SDK
      // This creates a session that the client can use for realtime
      console.log("🔐 Authenticating client SDK...");
      const session = await account.createEmailPasswordSession(email, password);
      
      // Get user data to confirm authentication
      const userData = await account.get();
      setUser(userData);
      setIsClientAuthenticated(true);
      console.log("✅ Client SDK authenticated for user:", userData.$id);
      return { success: true, user: userData };
    } catch (error) {
      console.error("❌ Failed to authenticate client:", error);
      setUser(null);
      setIsClientAuthenticated(false);
      return { success: false, error: error.message };
    }
  };

  const checkAuth = async () => {
    try {
      // Try to get current user (checks if session exists on client)
      const userData = await account.get();
      setUser(userData);
      setIsClientAuthenticated(true);
      console.log("✅ Client SDK authenticated for user:", userData.$id);
    } catch (error) {
      console.log("❌ No active session, client not authenticated");
      setUser(null);
      setIsClientAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setIsClientAuthenticated(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    loading,
    isClientAuthenticated, // New: indicates if client SDK is ready for realtime
    logout,
    checkAuth,
    loginWithCredentials, // New: authenticate client SDK directly
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
