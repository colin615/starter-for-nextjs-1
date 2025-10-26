"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userWithName, setUserWithName] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      // Transform user to include name from metadata
      setUserWithName({
        ...user,
        name: user.user_metadata?.full_name || user.email,
      });
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userWithName) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={userWithName} websites={[]} />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <DashboardLayoutClient>
            {children}
          </DashboardLayoutClient>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
