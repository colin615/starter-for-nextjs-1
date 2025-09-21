import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
      {children}
    </SidebarProvider>
  );
}
