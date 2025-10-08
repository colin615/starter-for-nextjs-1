"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";

export default function Page() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [creatingTest, setCreatingTest] = useState(false);

  const fetchLatestNotification = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log("Fetching notifications via API...");

      const response = await fetch("/api/fetch-notifications", {
        credentials: "include"
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      if (data.success) {
        setNotifications(data.notifications);
        setDebugInfo({
          totalNotifications: data.total,
          notificationsReturned: data.notifications.length,
          user: data.user
        });
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
      setDebugInfo({
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestNotification = async () => {
    setCreatingTest(true);
    try {
      // Get current user ID from debugInfo or fetch it
      if (!debugInfo?.user?.id) {
        throw new Error("Please fetch notifications first to get your user ID");
      }

      const testNotification = {
        userId: debugInfo.user.id,
        title: "Test Notification",
        message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
        type: ["success", "info", "warning", "error"][Math.floor(Math.random() * 4)],
        isRead: false,
      };

      console.log("Creating test notification:", testNotification);

      const result = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        testNotification
      );

      console.log("Test notification created:", result);
      
      // Refresh the list
      await fetchLatestNotification();
    } catch (err) {
      console.error("Error creating test notification:", err);
      setError(err.message);
    } finally {
      setCreatingTest(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Leaderboards</h1>
      
      <div className="space-y-4">
        {/* Current User Info from API */}
        {debugInfo?.user && (
          <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Current User</h3>
            <p className="text-sm text-blue-700">ID: {debugInfo.user.id}</p>
            <p className="text-sm text-blue-700">Email: {debugInfo.user.email}</p>
            <p className="text-sm text-blue-700">Name: {debugInfo.user.name}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={fetchLatestNotification}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Latest Notifications"}
          </Button>

          <Button 
            onClick={createTestNotification}
            disabled={creatingTest || !debugInfo?.user?.id}
            variant="outline"
          >
            {creatingTest ? "Creating..." : "Create Test Notification"}
          </Button>
        </div>

        {!debugInfo?.user?.id && (
          <p className="text-sm text-muted-foreground">
            💡 Fetch notifications first to enable test notification creation
          </p>
        )}

        {error && (
          <div className="p-4 border border-red-500 bg-red-50 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="p-4 border border-purple-500 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Debug Info</h3>
            <pre className="text-xs text-purple-700 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {notifications.length > 0 ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              Notifications ({notifications.length})
            </h2>
            {notifications.map((notif) => (
              <div 
                key={notif.$id} 
                className="p-4 border rounded-lg bg-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{notif.title}</h3>
                    {notif.message && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.$createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      User ID: {notif.userId}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    notif.isRead ? "bg-gray-200" : "bg-blue-100 text-blue-700"
                  }`}>
                    {notif.isRead ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : debugInfo && debugInfo.totalReturned === 0 ? (
          <div className="p-4 border border-yellow-500 bg-yellow-50 rounded-lg text-yellow-700">
            <p>No notifications found in the database.</p>
            <p className="text-sm mt-1">
              Make sure notifications exist and check the collection permissions.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
