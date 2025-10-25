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
    const days = parseInt(searchParams.get("days")) || 30;
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { tablesdb } = await createAdminClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Fetch daily data
    const dailyResult = await tablesdb.listRows({
      databaseId: 'skapex-dash-db',
      tableId: 'statistic_days',
      queries: [
        Query.equal('userId', userId),
        Query.greaterThanEqual('datetime', cutoffDate.toISOString()),
        Query.orderDesc('datetime')
      ]
    });

    // Process activity history
    const activityHistory = [];
    const userActivityMap = new Map();

    dailyResult.rows.forEach(row => {
      try {
        const data = JSON.parse(row.data_raw);
        const dayDate = new Date(row.datetime).toISOString().split('T')[0];
        
        if (Array.isArray(data)) {
          data.forEach(user => {
            const userId = user.uid || user.userId || user.id || user.username;
            if (!userActivityMap.has(userId)) {
              userActivityMap.set(userId, {
                userId,
                activityHistory: [],
                totalWagered: 0,
                totalWeighted: 0
              });
            }
            
            const userData = userActivityMap.get(userId);
            userData.totalWagered += user.wagered || 0;
            userData.totalWeighted += user.weightedWagered || 0;
            
            // Add to activity history
            userData.activityHistory.push({
              date: dayDate,
              activityScore: user.activityScore || 0,
              lastSeen: user.lastSeen,
              wagered: user.wagered || 0,
              weighted: user.weightedWagered || 0
            });
          });
        }
      } catch (err) {
        console.error('Error parsing daily data:', err);
      }
    });

    // Get the most recent user data
    const mostRecentUser = Array.from(userActivityMap.values())
      .sort((a, b) => {
        const aLastSeen = a.activityHistory[a.activityHistory.length - 1]?.lastSeen;
        const bLastSeen = b.activityHistory[b.activityHistory.length - 1]?.lastSeen;
        return new Date(bLastSeen || 0) - new Date(aLastSeen || 0);
      })[0];

    if (!mostRecentUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No activity history found' 
        },
        { status: 404 }
      );
    }

    // Calculate summary
    const avgActivityScore = mostRecentUser.activityHistory.length > 0
      ? mostRecentUser.activityHistory.reduce((sum, day) => sum + day.activityScore, 0) / mostRecentUser.activityHistory.length
      : 0;

    const totalDaysActive = new Set(mostRecentUser.activityHistory.map(day => day.date)).size;
    const lastSeen = mostRecentUser.activityHistory[mostRecentUser.activityHistory.length - 1]?.lastSeen;

    return NextResponse.json({
      success: true,
      data: {
        userId: mostRecentUser.userId,
        activityHistory: mostRecentUser.activityHistory,
        summary: {
          avgActivityScore: Math.round(avgActivityScore * 100) / 100,
          totalDaysActive,
          lastSeen,
          totalWagered: Math.round(mostRecentUser.totalWagered * 100) / 100,
          totalWeighted: Math.round(mostRecentUser.totalWeighted * 100) / 100
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
    console.error('Error fetching activity history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch activity history' 
      },
      { status: 500 }
    );
  }
}


