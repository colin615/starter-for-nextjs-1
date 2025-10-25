import { createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day";
    const limit = parseInt(searchParams.get("limit")) || 50;
    const minActivityScore = parseInt(searchParams.get("minActivityScore")) || 0;

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

    // Get the most recent data
    const result = await tablesdb.listRows({
      databaseId: 'skapex-dash-db',
      tableId: tableName,
      queries: [
        Query.orderDesc('datetime'),
        Query.limit(1)
      ]
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No data found' 
        },
        { status: 404 }
      );
    }

    // Process leaderboard data
    const leaderboard = [];
    const userMap = new Map();

    try {
      const data = JSON.parse(result.rows[0].data_raw);
      
      if (Array.isArray(data)) {
        data.forEach(user => {
          const userId = user.uid || user.userId || user.id || user.username;
          if ((user.activityScore || 0) >= minActivityScore) {
            userMap.set(userId, {
              username: user.username,
              activityScore: user.activityScore || 0,
              totalDaysActive: user.totalDaysActive || 0,
              lastSeen: user.lastSeen,
              totalWagered: user.wagered || 0,
              rankLevel: user.rankLevel,
              favoriteGameTitle: user.favoriteGameTitle,
              weightedWagered: user.weightedWagered || 0,
              highestMultiplier: user.highestMultiplier
            });
          }
        });
      }
    } catch (err) {
      console.error('Error parsing leaderboard data:', err);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse leaderboard data' 
        },
        { status: 500 }
      );
    }

    // Sort by activity score and limit results
    const sortedUsers = Array.from(userMap.values())
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        ...user
      }));

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: sortedUsers,
        period,
        generatedAt: new Date().toISOString(),
        totalUsers: sortedUsers.length
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leaderboard' 
      },
      { status: 500 }
    );
  }
}


