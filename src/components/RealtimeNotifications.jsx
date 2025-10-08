"use client";

import { useEffect, useState } from "react";
import { client, databases } from "@/lib/appwrite";
import { showToast } from "@/components/ui/toast";

export function RealtimeNotifications({ userId }) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!userId) {
      console.log("No userId provided for realtime notifications");
      return;
    }

    console.log("Setting up realtime notifications for user:", userId);

    // Subscribe to all documents in the notifications collection
    const unsubscribe = client.subscribe(
      [
        `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID}.documents`,
      ],
      (response) => {
        console.log("Realtime event received:", response);

        // Check if this is a document creation event
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const notification = response.payload;
          
          // Only show notifications for the current user
          if (notification.userId === userId) {
            console.log("New notification for current user:", notification);
            
            // Show toast notification
            showToast({
              title: notification.title,
              description: notification.message || "You have a new notification",
              variant: getVariantFromType(notification.type),
            });

            // Optional: Play a sound
            // playNotificationSound();
          }
        }
      }
    );

    setIsSubscribed(true);
    console.log("✅ Subscribed to realtime notifications");

    // Cleanup subscription on unmount
    return () => {
      console.log("Unsubscribing from realtime notifications");
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [userId]);

  // Helper to convert notification type to toast variant
  const getVariantFromType = (type) => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "destructive";
      case "warning":
        return "warning";
      case "info":
      default:
        return "default";
    }
  };

  // This component doesn't render anything visible
  // It just handles the realtime subscription
  return (
    <>
      {process.env.NODE_ENV === "development" && isSubscribed && (
        <div className="fixed bottom-4 left-4 z-50 rounded-md bg-green-500 px-3 py-1 text-xs text-white shadow-lg">
          🟢 Realtime Connected
        </div>
      )}
    </>
  );
}

