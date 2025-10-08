"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { client } from "@/lib/appwrite";

const DATABASE_ID = "skapex-dash-db";
const COLLECTION_ID = "notifications";

export default function Page() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to the notifications collection
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
      (response) => {
        console.log("Realtime notification received:", response);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user]);

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
            </div>
          ) : (
            <p className="text-muted-foreground">No user logged in</p>
          )}
        </div>

        <p className="text-muted-foreground">Leaderboard content coming soon...</p>
      </div>
    </div>
  );
}
