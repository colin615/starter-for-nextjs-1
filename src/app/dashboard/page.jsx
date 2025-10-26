"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DashboardClient } from "@/components/DashboardClient";
import { useMemo } from "react";

export default function Page() {
  const { user } = useAuth();

  // Transform user to include name from metadata
  const userWithName = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      name: user.user_metadata?.full_name || user.email,
    };
  }, [user]);

  if (!userWithName) {
    return null;
  }

  return <DashboardClient user={userWithName} />;
}
