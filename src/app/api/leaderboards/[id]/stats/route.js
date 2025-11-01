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

    // Fetch the specific leaderboard to get start_date and end_date
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('leaderboards')
      .select('start_date, end_date, casino_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();


    console.log(leaderboard);

    if (leaderboardError || !leaderboard) {
      return NextResponse.json(
        { success: false, error: "Leaderboard not found" },
        { status: 404 },
      );
    }

    const startDate = leaderboard.start_date;
    const endDate = leaderboard.end_date;
    const casinoId = leaderboard.casino_id;

    if (!startDate || !endDate) {
      return NextResponse.json({
        success: true,
        chartData: [],
        message: "Leaderboard missing date range"
      });
    }

    // Get session for JWT
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    // Call aggregate function with daily granularity
    const requestBody = {
      userId: user.id,
      startDate: startDate,
      endDate: endDate,
      jwt: session.access_token,
      mode: "visualize",
      granularity: "hour",
      ...(casinoId && { casinoId: casinoId })
    };

    const aggregateResponse = await fetch(
      "https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const aggregateData = await aggregateResponse.json();
    console.log(aggregateData);

    if (!aggregateData.success) {
      return NextResponse.json({
        success: true,
        chartData: [],
        message: "No data available"
      });
    }

    // Transform chartData to include date labels and format for chart
    const chartData = (aggregateData.chartData || aggregateData.timeSeries || []).map((item) => {
      const date = new Date(item.timestamp || item.date);
      return {
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        wagered: item.wagered || 0,
        users: item.uniquePlayers || item.userCount || 0,
        weightedWagered: item.weightedWagered || item.weighted || 0,
      };
    });

    return NextResponse.json({
      success: true,
      chartData: chartData,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Fetch leaderboard stats error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "An error occurred while fetching leaderboard stats",
        chartData: []
      },
      { status: 500 },
    );
  }
}

