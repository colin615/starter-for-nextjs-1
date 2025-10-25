import { createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "hour";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit")) || 100;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { tablesdb } = await createAdminClient();

    // Determine table based on period
    const tableMap = {
      '15min': 'statistic_quarters',
      'hour': 'statistic_hours',
      'day': 'statistic_days'
    };

    const tableName = tableMap[period];
    if (!tableName) {
      return NextResponse.json(
        { error: 'Invalid period. Use: 15min, hour, or day' },
        { status: 400 }
      );
    }

    // Build queries
    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('datetime'),
      Query.limit(limit)
    ];

    if (startDate) {
      queries.push(Query.greaterThanEqual('datetime', startDate));
    }
    if (endDate) {
      queries.push(Query.lessThanEqual('datetime', endDate));
    }

    // Fetch data
    const result = await tablesdb.listRows({
      databaseId: 'skapex-dash-db',
      tableId: tableName,
      queries
    });

    // Process data
    const users = [];
    const userMap = new Map();
    let totalWagered = 0;

    result.rows.forEach(row => {
      try {
        const data = JSON.parse(row.data_raw);
        if (Array.isArray(data)) {
          data.forEach(user => {
            const userId = user.uid || user.userId || user.id || user.username;
            if (!userMap.has(userId)) {
              userMap.set(userId, user);
              totalWagered += user.wagered || 0;
            }
          });
        }
      } catch (err) {
        console.error('Error parsing row data:', err);
      }
    });

    // Convert map to array and sort by activity score
    const userArray = Array.from(userMap.values())
      .sort((a, b) => (b.activityScore || 0) - (a.activityScore || 0));

    // Calculate summary
    const activeUsers = userArray.filter(user => 
      user.lastSeen && 
      new Date(user.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const avgActivityScore = userArray.length > 0 
      ? userArray.reduce((sum, user) => sum + (user.activityScore || 0), 0) / userArray.length 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        users: userArray,
        summary: {
          totalUsers: userArray.length,
          activeUsers,
          avgActivityScore: Math.round(avgActivityScore * 100) / 100,
          totalWagered: Math.round(totalWagered * 100) / 100
        },
        pagination: {
          limit: limit,
          offset: 0,
          total: userArray.length
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch activity data' 
      },
      { status: 500 }
    );
  }
}


