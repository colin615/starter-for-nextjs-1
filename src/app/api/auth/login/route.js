import { createAdminClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Create admin client and create session
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    // Set session cookie (for server-side auth)
    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 21, // 21 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: email,
      },
      session: {
        secret: session.secret, // Client needs this to authenticate with Appwrite
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    // Handle specific Appwrite errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (error.code === 429) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 },
    );
  }
}
