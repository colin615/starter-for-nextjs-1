"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log("Test notification sent:", data);
      } else {
        console.error("Failed to send test notification:", data);
      }
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

