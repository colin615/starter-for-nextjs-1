import { createSessionClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Try to get the session client to validate the session exists
    const { account } = await createSessionClient();

    // Delete the current session
    await account.deleteSession("current");
  } catch (error) {
    // If session doesn't exist or is invalid, continue with logout
    console.log("Session cleanup:", error.message);
  }

  // Clear both session cookies regardless of whether the session deletion succeeded
  const cookieStore = await cookies();
  cookieStore.set("appwrite-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  cookieStore.set("appwrite-session-client", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
