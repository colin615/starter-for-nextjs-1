"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useAppwriteSession } from "@/components/AppwriteSessionProvider";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAppwriteSession();
  
  // Loading is the opposite of isReady
  const loading = !isReady;

  const logout = async () => {
    try {
      // First delete client session
      const { account } = await import("@/lib/appwrite");
      try {
        await account.deleteSession("current");
        console.log("✅ Client session deleted");
      } catch (err) {
        console.log("⚠️ No client session to delete");
      }

      // Then call logout API route to clear server cookie
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      });

      if (response.ok) {
        console.log("✅ Server session cleared");
        // Redirect to login
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
        // Still redirect even if server logout failed
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect
      window.location.href = "/login";
    }
  };

  const checkAuth = async () => {
    // Trigger a page reload to re-initialize the session
    window.location.reload();
  };

  const value = {
    user,
    loading,
    logout,
    checkAuth,
    isAuthenticated,
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
