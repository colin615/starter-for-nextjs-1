"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
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
