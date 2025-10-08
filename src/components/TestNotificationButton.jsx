"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { databases } from "@/lib/appwrite";
import { ID, Permission, Role } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

/**
 * Test component to send a notification
 * Remove this in production - it's just for testing
 */
export function TestNotificationButton() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create notification directly with Appwrite client
      const notification = await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          title: "Test Notification 🎉",
          message: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
          type: "success",
          isRead: false,
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      );

      console.log("Test notification sent:", notification);
    } catch (error) {
      console.error("Error sending test notification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={sendTestNotification}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      <Bell className="h-4 w-4 mr-2" />
      {isLoading ? "Sending..." : "Send Test Notification"}
    </Button>
  );
}

