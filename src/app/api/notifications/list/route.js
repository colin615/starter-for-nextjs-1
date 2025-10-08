import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

const DATABASE_ID = "skapex-dash-db";
const NOTIFICATIONS_COLLECTION_ID =
  "notifications";

/**
 * GET /api/notifications/list
 * Get notifications for the current user
 */
export async function GET(request) {
  try {
    // Get the current session
    const { account, databases } = await createSessionClient();
    const user = await account.get();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch notifications for this user
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    );

    return NextResponse.json({
      success: true,
      notifications: response.documents,
      total: response.total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

