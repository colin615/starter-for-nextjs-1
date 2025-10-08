import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/session
 * Returns the current session token for client-side Appwrite SDK
 * This is needed for Realtime subscriptions to work
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("appwrite-session");

    if (!session || !session.value) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Return the session value (it's safe to send to the authenticated client)
    return NextResponse.json({
      session: session.value,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}

