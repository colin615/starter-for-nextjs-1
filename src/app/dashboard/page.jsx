import { getLoggedInUser } from "@/lib/server/appwrite";
import { DashboardClient } from "@/components/DashboardClient";

export default async function Page() {
  // User is already authenticated in the layout, but we need it for leaderboards
  const user = await getLoggedInUser();

  return <DashboardClient user={user} />;
}
