import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

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
    const { account, tablesdb } = await createSessionClient();
    const user = await account.get();

    // Find the linked_api document
    const linkedApis = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "linked_apis",
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("identifier", [identifier]),
      ],
    });

    if (linkedApis.total === 0) {
      return NextResponse.json(
        { error: "No linked service found" },
        { status: 404 },
      );
    }

    const linkedApiDoc = linkedApis.rows[0];

    // Delete all hourly statistics for this user and service
    let hourlyDeleted = 0;
    try {
      const hourlyStats = await tablesdb.listRows({
        databaseId: "skapex-dash-db",
        tableId: "statistic_hours",
        queries: [
          Query.equal("userId", [user.$id]),
          Query.equal("identifier", [identifier]),
          Query.limit(5000), // Process in batches if needed
        ],
      });

      for (const stat of hourlyStats.rows) {
        await tablesdb.deleteRow({
          databaseId: "skapex-dash-db",
          tableId: "statistic_hours",
          rowId: stat.$id,
        });
        hourlyDeleted++;
      }
    } catch (error) {
      console.error("Error deleting hourly statistics:", error);
    }

    // Delete all daily statistics for this user and service
    let dailyDeleted = 0;
    try {
      const dailyStats = await tablesdb.listRows({
        databaseId: "skapex-dash-db",
        tableId: "statistic_days",
        queries: [
          Query.equal("userId", [user.$id]),
          Query.equal("identifier", [identifier]),
          Query.limit(5000), // Process in batches if needed
        ],
      });

      for (const stat of dailyStats.rows) {
        await tablesdb.deleteRow({
          databaseId: "skapex-dash-db",
          tableId: "statistic_days",
          rowId: stat.$id,
        });
        dailyDeleted++;
      }
    } catch (error) {
      console.error("Error deleting daily statistics:", error);
    }

    // Delete the linked_api document
    await tablesdb.deleteRow({
      databaseId: "skapex-dash-db",
      tableId: "linked_apis",
      rowId: linkedApiDoc.$id,
    });

    console.log(`Unlinked service ${identifier} for user ${user.$id}. Deleted ${hourlyDeleted} hourly stats and ${dailyDeleted} daily stats.`);

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

