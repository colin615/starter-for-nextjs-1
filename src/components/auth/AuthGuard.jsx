import { getLoggedInUser } from "@/lib/server/supabase";
import { redirect } from "next/navigation";

export default async function AuthGuard({ children }) {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
