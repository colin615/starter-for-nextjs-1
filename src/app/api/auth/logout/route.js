import { createSessionClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  // Client already deleted the Appwrite session
  // We just need to clear our server-side cookie
  
  const cookieStore = await cookies();
  
  // Clear server-side session cookie
  cookieStore.set("appwrite-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  console.log("✅ Server session cookie cleared");

  return NextResponse.json({ success: true });
}
