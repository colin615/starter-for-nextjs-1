import { createAdminClient } from "@/lib/server/supabase";
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

    // Use admin client to sign up
    const supabase = await createAdminClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      // Handle Supabase errors
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      if (error.message.includes("Invalid email")) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }

      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: error.message || "An error occurred during signup" },
        { status: 400 },
      );
    }

    // Update the user's display name after creation using the admin API
    if (data.user) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        data.user.id,
        {
          display_name: name,
        }
      );

      if (updateError) {
        console.error("Error updating display name:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup. Please try again." },
      { status: 500 },
    );
  }
}
