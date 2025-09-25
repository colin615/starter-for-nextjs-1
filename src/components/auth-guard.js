import { getLoggedInUser } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";

export default async function AuthGuard({ children }) {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
