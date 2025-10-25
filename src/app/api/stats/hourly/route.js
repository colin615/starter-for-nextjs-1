import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1w"; // Default to 1 week

    const { tablesdb } = await createSessionClient();

    // Calculate the start time based on period
    let daysAgo = 7; // Default 1 week
    switch (period) {
      case "1d":
        daysAgo = 1;
        break;
      case "1w":
        daysAgo = 7;
        break;
      case "2w":
        daysAgo = 14;
        break;
      case "30d":
        daysAgo = 30;
        break;
      default:
        daysAgo = 7;
    }

    const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const endTime = new Date();

    const stats = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "statistic_days",
      queries: [
        Query.greaterThanEqual("datetime", startTime.toISOString()),
        Query.lessThanEqual("datetime", endTime.toISOString()),
        Query.orderAsc("datetime"),
        Query.limit(100)
      ],
    });

    console.log(`Fetched ${stats.rows.length} daily stats for period ${period}`);

    // Process the daily data
    const chartData = stats.rows.map((row) => {
      let wagered = 0;
      let weighted = 0;

      // Parse the data_key array to extract wagered and weighted values
      try {
        if (row.data_key && Array.isArray(row.data_key)) {
          row.data_key.forEach((item) => {
            const parsed = JSON.parse(item);
            if (parsed.wagered !== undefined) wagered = parsed.wagered;
            if (parsed.weighted !== undefined) weighted = parsed.weighted;
          });
        }
      } catch (error) {
        console.error("Error parsing data_key:", error);
      }

      const date = new Date(row.datetime);
      
      return {
        day: date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        }),
        fullDate: row.datetime,
        wagered: Math.round(wagered * 100) / 100,
        weighted: Math.round(weighted * 100) / 100,
        identifier: row.identifier,
        dayId: row.day_id,
      };
    });

    // Calculate totals
    const totalWagered = chartData.reduce((sum, item) => sum + item.wagered, 0);
    const totalWeighted = chartData.reduce((sum, item) => sum + item.weighted, 0);

    return NextResponse.json({
      chartData,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWeighted: Math.round(totalWeighted * 100) / 100,
      daysReturned: chartData.length,
      period,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Fetch daily stats error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching daily stats" },
      { status: 500 },
    );
  }
}

