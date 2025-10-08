"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

export default function Page() {
  const { user, loading } = useAuth();
  const { notifications, isConnected } = useNotifications();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Leaderboards</h1>
      
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">User Information</h2>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading user data...</p>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">User ID:</span>{" "}
                <code className="rounded bg-muted px-2 py-1 text-sm">{user.$id}</code>
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="font-medium">Notifications:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isConnected 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No user logged in</p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Recent Notifications</h2>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.$id}
                  className="p-3 rounded-md bg-muted/50 border"
                >
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(notification, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          )}
        </div>

        <p className="text-muted-foreground">Leaderboard content coming soon...</p>
      </div>
    </div>
  );
}
