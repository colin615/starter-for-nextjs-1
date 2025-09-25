import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { getLoggedInUser } from "@/lib/server/appwrite";
import { getUserLeaderboards } from "@/lib/server/profile";
import { DashboardClient } from "@/components/DashboardClient";

export default async function Page() {
  // User is already authenticated in the layout, but we need it for leaderboards
  const user = await getLoggedInUser();
  if (!user) {
    return null; // This shouldn't happen since layout handles auth
  }
  const leaderboards = await getUserLeaderboards(user.$id);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <DashboardClient user={user} initialLeaderboards={leaderboards} />
     
    </SidebarInset>
  );
}
