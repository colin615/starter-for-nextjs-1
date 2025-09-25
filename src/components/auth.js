"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// LogoutButton component
export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}

// Navigation component
export function Navigation() {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAccountPage = pathname === "/account";

  if (isAuthPage) {
    return null; // Don't show navigation on auth pages
  }

  return (
    <nav className="border-b border-[#EDEDF0] bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-[#FD366E]">
            Appwrite + Next.js
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAccountPage ? (
            <Link
              href="/login"
              className="text-[#56565C] transition-colors hover:text-[#FD366E]"
            >
              Logout
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#56565C] transition-colors hover:text-[#FD366E]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[#FD366E] px-4 py-2 text-white transition-colors hover:bg-[#e02e5d]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
