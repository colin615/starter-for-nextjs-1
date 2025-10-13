import { AppSidebar } from "@/components/app-sidebar";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { getLoggedInUser } from "@/lib/server/appwrite";
import { getUserWebsites, getUserLeaderboards } from "@/lib/server/profile";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  const websites = await getUserWebsites(user.$id);
  const leaderboards = await getUserLeaderboards(user.$id);

  return (
    <SidebarProvider>
      <AppSidebar user={user} websites={websites} />
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
