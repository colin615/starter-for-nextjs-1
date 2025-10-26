import { NextResponse } from "next/server";
import { getLoggedInUser } from "./src/lib/server/supabase";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes that require authentication
  const protectedRoutes = ["/account"];
  const isProtectedRoute = protectedRoutes.includes(pathname);

  try {
    // Try to get logged in user to check if user is authenticated
    const user = await getLoggedInUser();
    const isAuthenticated = !!user;

    // If user is authenticated and trying to access login/signup, redirect to account
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    // If user is authenticated and accessing root, redirect to account
    if (isAuthenticated && pathname === "/") {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  } catch (error) {
    // User is not authenticated
    const isAuthenticated = false;

    // If user is not authenticated and trying to access protected route, redirect to login
    if (!isAuthenticated && isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is not authenticated and accessing root, redirect to login
    if (!isAuthenticated && pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
