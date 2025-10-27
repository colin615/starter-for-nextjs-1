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

    // Fetch all linked_apis for this user
    const { data: linkedApis, error } = await supabase
      .from('linked_apis')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      linked: linkedApis || [],
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Fetch linked services error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching linked services" },
      { status: 500 },
    );
  }
}

