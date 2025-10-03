"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function DashboardClient({ user }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0]; // yyyy-mm-dd
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const fetchStats = async () => {
    // Step 1: Take local user date input
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");

    // Step 2: Convert to UTC ISO (Appwrite requires this)
    const startISO = start.toISOString(); // e.g. "2025-09-17T00:00:00.000Z"
    const endISO = end.toISOString();

    console.log("Fetching stats:", { startISO, endISO });

    // Step 3: Fetch from API
    const stats = await fetch(`/api/stats?start=${startISO}&end=${endISO}`);
    const data = await stats.json();
    console.log("Stats response:", data);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Overview</h1>

      {/* Date inputs */}
      <div className="flex space-x-2 items-center">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Fetch button */}
      <Button onClick={fetchStats}>Fetch Stats</Button>
    </div>
  );
}
