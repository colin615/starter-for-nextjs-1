import { createServerClient, getLoggedInUser } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = await createServerClient();

    // Fetch all leaderboards for this user
    const { data: leaderboards, error } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching leaderboards:", error);
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          leaderboards: [],
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      leaderboards: leaderboards || [],
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Fetch leaderboards error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "An error occurred while fetching leaderboards",
        leaderboards: []
      },
      { status: 500 },
    );
  }
}

