import { NextResponse } from "next/server";

// This route is now simplified - we'll handle auth client-side
// since Appwrite is on a different domain
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

    // Return success - actual authentication happens client-side
    // This allows Appwrite to set its own cookies
    return NextResponse.json({
      success: true,
      message: "Credentials validated",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 },
    );
  }
}
