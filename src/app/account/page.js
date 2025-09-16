import { getLoggedInUser } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { TextureButton } from "@/components/ui/texture-btn";

export default async function AccountPage() {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#FAFAFB] p-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-[#2D2D31]">
                Welcome back!
              </h1>
              <p className="text-[#56565C]">Manage your account settings</p>
            </div>
            <LogoutButton />
           
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-[#FAFAFB] p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#2D2D31]">
                Profile Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#56565C]">
                    User ID
                  </label>
                  <p className="font-mono text-sm text-[#2D2D31]">{user.$id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#56565C]">
                    Email
                  </label>
                  <p className="text-[#2D2D31]">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#56565C]">
                    Account Status
                  </label>
                  <p className="font-medium text-green-600">
                    {user.emailVerification ? "Verified" : "Unverified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#56565C]">
                    Created
                  </label>
                  <p className="text-[#2D2D31]">
                    {new Date(user.$createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#FAFAFB] p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#2D2D31]">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full rounded-md bg-[#FD366E] px-4 py-2 text-white transition-colors hover:bg-[#e02e5d]">
                  Update Profile
                </button>
                <button className="w-full rounded-md bg-[#FD366E] px-4 py-2 text-white transition-colors hover:bg-[#e02e5d]">
                  Change Password
                </button>
                <button className="w-full rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600">
                  View Appwrite Console
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-[#FAFAFB] p-6">
            <h2 className="mb-4 text-xl font-semibold text-[#2D2D31]">
              Recent Activity
            </h2>
            <div className="text-[#56565C]">
              <p>No recent activity to display.</p>
              <p className="mt-2 text-sm">
                Activity logs will appear here as you use the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
