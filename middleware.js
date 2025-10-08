import { NextResponse } from "next/server";

// Since we're using client-side auth with Appwrite (different domain),
// we can't check auth in middleware. Let client-side handle redirects.
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow all routes - client-side AuthGuard will handle protection
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
