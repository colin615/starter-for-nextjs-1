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

    const stats = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "statistic_days",
      queries: [Query.between("datetime", start, end)],
    });

    const result = stats.rows.map((row) => ({
      date: row.datetime,
      data: row.data_key,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch stats error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching stats" },
      { status: 500 },
    );
  }
}