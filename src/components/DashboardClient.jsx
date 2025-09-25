"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function DashboardClient({ user, initialLeaderboards }) {
  const [websites, setWebsites] = useState([]);
  const { user: authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const result = await databases.listDocuments(
        "skapex-dash-db",
        "websites",
      );
      setWebsites(result.documents || []);
    } catch (error) {
      console.error("Failed to fetch websites:", error);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1>Overview</h1>
      </div>

      <h2 className="text-lg font-semibold text-white">Your Websites</h2>
      {websites.length > 0 ? (
        <ul className="list-inside list-disc text-white">
          {websites.map((site) => (
            <li key={site.$id}>{site.name}</li>
          ))}
        </ul>
      ) : (
        <p>No websites yet.</p>
      )}

      <h2 className="mt-4 text-lg font-semibold text-white">
        Your Leaderboards
      </h2>
      {initialLeaderboards.length > 0 ? (
        <ul className="list-inside list-disc text-white">
          {initialLeaderboards.map((lb, index) => (
            <li key={index}>{lb.name}</li>
          ))}
        </ul>
      ) : (
        <p>No leaderboards yet.</p>
      )}
    </div>
  );
}
