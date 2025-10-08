"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState } from "react";

/**
 * Test component to send a notification
 * Remove this in production - it's just for testing
 */
export function TestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    console.log("🔔 Sending test notification...");
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
        console.log("✅ Test notification sent successfully:", data);
        alert("Test notification sent! Check the bell icon.");
      } else {
        console.error("❌ Failed to send test notification:", data);
        alert("Failed to send notification: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
      alert("Error: " + error.message);
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
      className="relative"
    >
      <Bell className="h-4 w-4 mr-2" />
      {isLoading ? "Sending..." : "Send Test Notification"}
    </Button>
  );
}

