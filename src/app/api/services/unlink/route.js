import { createServerClient, getLoggedInUser } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    const { identifier } = payload;

    // Validate input
    if (!identifier) {
      return NextResponse.json(
        { error: "Service identifier is required" },
        { status: 400 },
      );
    }

    // Get user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = await createServerClient();

    // Find the linked_api document
    const { data: linkedApis, error: fetchError } = await supabase
      .from('linked_apis')
      .select('*')
      .eq('user_id', user.id)
      .eq('identifier', identifier);

    if (fetchError) throw fetchError;

    if (!linkedApis || linkedApis.length === 0) {
      return NextResponse.json(
        { error: "No linked service found" },
        { status: 404 },
      );
    }

    const linkedApiDoc = linkedApis[0];

    // Delete all hourly statistics for this user and service
    let hourlyDeleted = 0;
    try {
      const { data: hourlyStats, error: hourlyError } = await supabase
        .from('statistic_hours')
        .select('id')
        .eq('user_id', user.id)
        .eq('identifier', identifier)
        .limit(5000);

      if (!hourlyError && hourlyStats) {
        for (const stat of hourlyStats) {
          const { error: deleteError } = await supabase
            .from('statistic_hours')
            .delete()
            .eq('id', stat.id);
          
          if (!deleteError) hourlyDeleted++;
        }
      }
    } catch (error) {
      console.error("Error deleting hourly statistics:", error);
    }

    // Delete all daily statistics for this user and service
    let dailyDeleted = 0;
    try {
      const { data: dailyStats, error: dailyError } = await supabase
        .from('statistic_days')
        .select('id')
        .eq('user_id', user.id)
        .eq('identifier', identifier)
        .limit(5000);

      if (!dailyError && dailyStats) {
        for (const stat of dailyStats) {
          const { error: deleteError } = await supabase
            .from('statistic_days')
            .delete()
            .eq('id', stat.id);
          
          if (!deleteError) dailyDeleted++;
        }
      }
    } catch (error) {
      console.error("Error deleting daily statistics:", error);
    }

    // Delete the linked_api document
    const { error: deleteLinkedError } = await supabase
      .from('linked_apis')
      .delete()
      .eq('id', linkedApiDoc.id);

    if (deleteLinkedError) throw deleteLinkedError;

    console.log(`Unlinked service ${identifier} for user ${user.id}. Deleted ${hourlyDeleted} hourly stats and ${dailyDeleted} daily stats.`);

    return NextResponse.json({
      success: true,
      deleted: {
        hourly: hourlyDeleted,
        daily: dailyDeleted,
      },
    });
  } catch (error) {
    console.error("Unlink service error:", error);
    return NextResponse.json(
      { error: "An error occurred while unlinking the service" },
      { status: 500 },
    );
  }
}

