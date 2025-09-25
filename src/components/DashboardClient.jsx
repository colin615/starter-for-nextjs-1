"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createAvatar } from "@dicebear/core";
import { avataaarsNeutral } from "@dicebear/collection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LineChart3 from "@/components/line-chart-3";

export function DashboardClient({ user, initialLeaderboards }) {
  const [websites, setWebsites] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();
  const router = useRouter();

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      const startUTC = start.toISOString();
      const endUTC = now.toISOString();
      try {
        const response = await fetch(
          `/api/stats?start=${startUTC}&end=${endUTC}`,
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch stats");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1>Overview</h1>
      </div>

      <div className="mb-4">
        <h2>Stats</h2>
        {stats.length > 0 ? (
          <ul>
            {stats.map((stat, index) => {
              const localDate = new Date(stat.date).toLocaleDateString();
              return (
                <li key={index}>
                  Date: {localDate}, Data: {JSON.stringify(stat.data)}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No stats available</p>
        )}
      </div>

      <LineChart3
        data={stats}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        loading={loading}
      />

    </div>
  );
}
