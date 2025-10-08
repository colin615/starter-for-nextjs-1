"use client";

import * as React from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { client, databases, account } from "@/lib/appwrite";
import { cn } from "@/lib/utils";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

export function NotificationCenter({ userId }) {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  console.log("🔔 NotificationCenter rendering", { userId, unreadCount });

  // Fetch notifications on mount
  React.useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [userId]);

  // Subscribe to realtime updates
  React.useEffect(() => {
    if (!userId) return;

    // Subscribe to the notifications collection for this user
    const unsubscribe = client.subscribe(
      [
        `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`,
      ],
      (response) => {
        // Check if the notification is for this user
        if (response.payload.userId === userId) {
          if (
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents.*.create`,
            )
          ) {
            // New notification created
            setNotifications((prev) => [response.payload, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else if (
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents.*.update`,
            )
          ) {
            // Notification updated (e.g., marked as read)
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.$id === response.payload.$id ? response.payload : notif,
              ),
            );
          } else if (
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents.*.delete`,
            )
          ) {
            // Notification deleted
            setNotifications((prev) =>
              prev.filter((notif) => notif.$id !== response.payload.$id),
            );
          }
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Update unread count when notifications change
  React.useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // Use API route instead of direct database call (avoids auth issues)
      const response = await fetch("/api/notifications/list");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        console.log("✅ Loaded", data.total, "notifications");
      } else {
        console.error("Failed to fetch notifications:", data.error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.$id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );

      // Update via API
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        // Revert on error
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.$id === notificationId ? { ...notif, isRead: false } : notif,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );

      // Update via API
      await Promise.all(
        unreadNotifications.map((notif) =>
          fetch(`/api/notifications/${notif.$id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          }),
        ),
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Refetch on error
      fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Optimistically update UI
      const oldNotifications = notifications;
      setNotifications((prev) =>
        prev.filter((notif) => notif.$id !== notificationId),
      );

      // Delete via API
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert on error
        setNotifications(oldNotifications);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  // Always render the bell icon, even if user is not loaded yet
  return (
    <div className="flex items-center">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-accent"
            disabled={!userId}
            title={!userId ? "Loading..." : "Notifications"}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.$id}
                  className={cn(
                    "rounded-lg border p-4 transition-colors hover:bg-accent/50",
                    !notification.isRead && "bg-accent/30 border-primary/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.$createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsRead(notification.$id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteNotification(notification.$id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
    </div>
  );
}

