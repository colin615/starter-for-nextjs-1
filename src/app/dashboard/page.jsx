import { getLoggedInUser } from "@/lib/server/supabase";
import { DashboardClient } from "@/components/DashboardClient";

export default async function Page() {
  // User is already authenticated in the layout, but we need it for leaderboards
  const user = await getLoggedInUser();

  // Transform user to include name from metadata
  const userWithName = {
    ...user,
    name: user.user_metadata?.full_name || user.email,
  };

  return <DashboardClient user={userWithName} />;
}
