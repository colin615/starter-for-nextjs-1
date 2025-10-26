import { createServerClient } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const supabase = await createServerClient();
    
    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Logout error:", error.message);
    // Always return success even if there's an error
    return NextResponse.json({ success: true });
  }
}
