import { AppSidebar } from "@/components/app-sidebar";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { getLoggedInUser } from "@/lib/server/supabase";
import { getUserWebsites, getUserLeaderboards } from "@/lib/server/profile";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  // Transform user to include name from metadata
  const userWithName = {
    ...user,
    name: user.user_metadata?.full_name || user.email,
  };

  const websites = await getUserWebsites(user.id);
  const leaderboards = await getUserLeaderboards(user.id);

  return (
    <SidebarProvider>
      <AppSidebar user={userWithName} websites={websites} />
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
