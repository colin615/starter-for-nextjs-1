import { getLoggedInUser } from "@/lib/server/supabase";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getLoggedInUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
