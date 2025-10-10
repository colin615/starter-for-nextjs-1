import { createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    // Create admin client and create account
    const { account } = await createAdminClient();
    const user = await account.create("unique()", email, password, name);

    return NextResponse.json({
      success: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific Appwrite errors
    if (error.code === 409) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    if (error.code === 400) {
      return NextResponse.json(
        { error: "Invalid email or password format" },
        { status: 400 },
      );
    }

    if (error.code === 429) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during signup. Please try again." },
      { status: 500 },
    );
  }
}
