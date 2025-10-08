"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { client } from "@/lib/appwrite";

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

    // User is authenticated, connect to realtime
    console.log("NotificationContext: Connecting for user:", user.$id);

    let unsubscribe;

    try {
      // Subscribe to the notifications collection
      unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
        (response) => {
          console.log("Realtime notification received:", response);
          
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

      setIsConnected(true);
      console.log("NotificationContext: Successfully connected to realtime");
    } catch (error) {
      console.error("NotificationContext: Failed to connect to realtime:", error);
      setIsConnected(false);
    }

    // Cleanup subscription on unmount or when user changes
    return () => {
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
