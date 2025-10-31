"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leaderboards, setLeaderboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      fetchLeaderboards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaderboards");
      const data = await response.json();
      if (data.success) {
        setLeaderboards(data.leaderboards || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboards</h1>
        <Button
          variant="popout"
          onClick={() => router.push("/dashboard/leaderboards/create")}
          className="!bg-gradient-to-b from-[#8BFF4D] to-[#5AB22B] !text-black"
        >
          <PlusIcon className="size-4" />
          Create new leaderboard
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading leaderboards...</p>
          </div>
        ) : leaderboards.length === 0 ? (
          <p className="text-muted-foreground">No leaderboards found. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {leaderboards.map((leaderboard) => (
              <div
                key={leaderboard.id}
                className="w-full !h-[5rem] rounded-sm border bg-card p-4"
              >
                {/* Leaderboard content */}
                {leaderboard.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
