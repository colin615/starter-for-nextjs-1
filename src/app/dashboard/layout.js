import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getLoggedInUser } from "@/lib/server/appwrite";
import { getUserWebsites, getUserLeaderboards } from "@/lib/server/profile";
import { redirect } from "next/navigation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Separator } from "@/components/ui/separator";

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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Page title or breadcrumbs */}
            </div>
            <NotificationCenter userId={user.$id} />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
