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
        // Ensure client session is properly set by getting session from cookies
        if (typeof window !== "undefined") {
          const sessionCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("appwrite-session-client="));
          
          if (sessionCookie) {
            const sessionSecret = sessionCookie.split("=")[1];
            console.log("NotificationContext: Setting session for WebSocket connection");
            client.setSession(sessionSecret);
          } else {
            // Fallback to localStorage for localhost
            const sessionSecret = localStorage.getItem("appwrite-session");
            if (sessionSecret) {
              console.log("NotificationContext: Setting session from localStorage");
              client.setSession(sessionSecret);
            } else {
              console.error("NotificationContext: No session found in cookies or localStorage");
              setIsConnected(false);
              return;
            }
          }
        }

        // Verify we have a valid session before subscribing
        try {
          await account.get();
          console.log("NotificationContext: Session verified, subscribing to realtime");
        } catch (error) {
          console.error("NotificationContext: Invalid session, cannot connect to realtime:", error);
          setIsConnected(false);
          return;
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
