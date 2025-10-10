import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 },
      );
    }

    const { tablesdb } = await createSessionClient();

    let stats = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "statistic_days",
      queries: [Query.between("datetime", start, end), Query.orderAsc("datetime"), Query.limit(100)],
    });



    console.log(stats.rows.length, "LENG")


    const result = stats.rows.map((row) => ({
      date: row.datetime,
      data: row.data_key,
      raw: row.data_raw,
      identifier: row.identifier
    }));

    // Collect unique users from all data arrays
    const uniqueUsers = new Set();
    
    // Group users by day for the chart
    const usersPerDay = {};
    
    result.forEach((item) => {
      try {
        const dataArray = JSON.parse(item.raw);
        if (Array.isArray(dataArray)) {
          const dayUsers = new Set();
          dataArray.forEach((obj) => {
            if (obj.uid) {
              uniqueUsers.add(obj.uid);
              dayUsers.add(obj.uid);
            }
          });
          // Store unique users for this day
          usersPerDay[item.date] = dayUsers.size;
        }
      } catch (error) {
        console.error("Error parsing data for item:", item.date, error);
        usersPerDay[item.date] = 0;
      }
    });

    // Convert to array format for chart
    const chartData = Object.entries(usersPerDay)
      .map(([date, count]) => ({
        date: date,
        activeUsers: count,
        displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Found ${uniqueUsers.size} unique users across ${result.length} days`);

    return NextResponse.json({
      result,
      uniqueUsers: uniqueUsers.size,
      chartData: chartData
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching stats" },
      { status: 500 },
    );
  }
}