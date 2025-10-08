"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { client, account } from "@/lib/appwrite";

/**
 * Context to track when the Appwrite client session is ready
 */
const AppwriteSessionContext = createContext({ 
  isReady: false, 
  userId: null,
  user: null,
  isAuthenticated: false
});

export function useAppwriteSession() {
  return useContext(AppwriteSessionContext);
}

/**
 * This component ensures the client-side Appwrite SDK has the session
 * Without this, Realtime subscriptions won't receive events (user: null)
 */
export function AppwriteSessionProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        console.log("🔐 AppwriteSessionProvider: Checking client session...");
        
        // Try to get the current user from Appwrite SDK
        // The SDK automatically manages cookies with Appwrite Cloud
        try {
          const userData = await account.get();
          
          if (!mounted) return;
          
          console.log("✅ AppwriteSessionProvider: Client authenticated as", userData.$id);
          console.log("🔔 Realtime is ready with authenticated user!");
          
          setUser(userData);
          setUserId(userData.$id);
          setIsAuthenticated(true);
          setIsReady(true);
        } catch (accountError) {
          console.log("⚠️ AppwriteSessionProvider: No active session (user not logged in)");
          console.log("Error details:", accountError.message);
          if (mounted) {
            setIsReady(true);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("❌ AppwriteSessionProvider: Error checking session", error);
        if (mounted) {
          setIsReady(true);
          setIsAuthenticated(false);
        }
      }
    };

    // Small delay to ensure session is fully established
    const timer = setTimeout(initSession, 200);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <AppwriteSessionContext.Provider value={{ 
      isReady, 
      userId, 
      user,
      isAuthenticated
    }}>
      {children}
    </AppwriteSessionContext.Provider>
  );
}

