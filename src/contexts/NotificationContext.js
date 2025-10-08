"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { client, account } from "@/lib/appwrite";

const NotificationContext = createContext();

const DATABASE_ID = "skapex-dash-db";
const COLLECTION_ID = "notifications";

export function NotificationProvider({ children }) {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Don't attempt to connect if still loading auth state
    if (loading) {
      return;
    }

    // Don't connect if user is not authenticated
    if (!user || !user.$id) {
      console.log("NotificationContext: User not authenticated, skipping connection");
      setIsConnected(false);
      return;
    }

    // User is authenticated, ensure session is set and connect to realtime
    console.log("NotificationContext: Connecting for user:", user.$id);

    let unsubscribe;
    let connectionTimeout;

    const connectRealtime = async () => {
      try {
        // Generate JWT from existing session for WebSocket authentication
        if (typeof window !== "undefined") {
          try {
            // Check if we have a cached JWT that's still valid
            let jwt = localStorage.getItem("appwrite-realtime-jwt");
            let needsNewJwt = !jwt;
            
            if (jwt) {
              // Decode JWT to check expiration (basic check)
              try {
                const payload = JSON.parse(atob(jwt.split('.')[1]));
                const expiresAt = payload.exp * 1000; // Convert to milliseconds
                const now = Date.now();
                const bufferTime = 60 * 1000; // Refresh 1 min before expiry
                
                if (now >= (expiresAt - bufferTime)) {
                  console.log("NotificationContext: JWT expired or expiring soon, generating new one");
                  needsNewJwt = true;
                }
              } catch (e) {
                console.log("NotificationContext: Invalid JWT format, generating new one");
                needsNewJwt = true;
              }
            }
            
            // Generate new JWT if needed
            if (needsNewJwt) {
              console.log("NotificationContext: Generating JWT from session for WebSocket");
              const jwtResponse = await account.createJWT();
              jwt = jwtResponse.jwt;
              localStorage.setItem("appwrite-realtime-jwt", jwt);
              console.log("NotificationContext: JWT generated and cached");
            } else {
              console.log("NotificationContext: Using cached JWT for WebSocket");
            }
            
            // Set JWT for WebSocket client
            client.setJWT(jwt);
            console.log("NotificationContext: JWT set, ready to subscribe to realtime");
            
          } catch (error) {
            console.error("NotificationContext: Failed to generate JWT from session:", error);
            setIsConnected(false);
            return;
          }
        }

        // Track if we've received the first message (indicates successful connection)
        let connectionEstablished = false;
        
        // Set a timeout to mark as connected if we don't receive a message
        // This gives the WebSocket time to authenticate
        connectionTimeout = setTimeout(() => {
          if (!connectionEstablished) {
            console.log("NotificationContext: Connection timeout - assuming connected");
            setIsConnected(true);
          }
        }, 2000);

        // Subscribe to the notifications collection
        unsubscribe = client.subscribe(
          `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
          (response) => {
            console.log("Realtime notification received:", response);
            
            // Mark as connected on first successful message
            if (!connectionEstablished) {
              connectionEstablished = true;
              clearTimeout(connectionTimeout);
              setIsConnected(true);
              console.log("NotificationContext: Successfully connected to realtime (message received)");
            }
            
            // Handle different event types
            if (response.events.includes(`databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.*.create`)) {
              // New notification created
              setNotifications((prev) => [response.payload, ...prev]);
            } else if (response.events.includes(`databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.*.update`)) {
              // Notification updated
              setNotifications((prev) =>
                prev.map((notif) =>
                  notif.$id === response.payload.$id ? response.payload : notif
                )
              );
            } else if (response.events.includes(`databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.*.delete`)) {
              // Notification deleted
              setNotifications((prev) =>
                prev.filter((notif) => notif.$id !== response.payload.$id)
              );
            }
          }
        );

        console.log("NotificationContext: Subscription initiated, waiting for connection...");
      } catch (error) {
        console.error("NotificationContext: Failed to connect to realtime:", error);
        setIsConnected(false);
      }
    };

    connectRealtime();

    // Cleanup subscription on unmount or when user changes
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (unsubscribe) {
        console.log("NotificationContext: Disconnecting from realtime");
        unsubscribe();
        setIsConnected(false);
      }
    };
  }, [user, loading]);

  const value = {
    notifications,
    isConnected,
    clearNotifications: () => setNotifications([]),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
