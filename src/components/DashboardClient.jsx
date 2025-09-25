"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function DashboardClient({ user, initialLeaderboards }) {
  const [websites, setWebsites] = useState([]);
  const { user: authUser } = useAuth();
  const router = useRouter();



  return (
    <div className="p-4">
      <div className="mb-4">
        <h1>Overview</h1>
      </div>

     
    </div>
  );
}
