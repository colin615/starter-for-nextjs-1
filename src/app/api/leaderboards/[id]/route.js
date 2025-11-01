import { createServerClient, getLoggedInUser } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = await createServerClient();

    // Fetch the specific leaderboard
    const { data: leaderboard, error } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching leaderboard:", error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: "Leaderboard not found" },
          { status: 404 },
        );
      }
      
      throw error;
    }

    if (!leaderboard) {
      return NextResponse.json(
        { success: false, error: "Leaderboard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "An error occurred while fetching the leaderboard",
      },
      { status: 500 },
    );
  }
}

