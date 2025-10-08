import { createSessionClient, createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";

const DATABASE_ID = "skapex-dash-db";
const NOTIFICATIONS_COLLECTION_ID =
  "notifications";

/**
 * POST /api/notifications/test
 * Test endpoint to create a sample notification for the current user
 * This is useful for testing the notification system
 */
export async function POST(request) {
  try {
    // Get the current session
    const { account } = await createSessionClient();
    const user = await account.get();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to create the notification
    const { databases } = await createAdminClient();

    // Create a test notification
    const notification = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        title: "Test Notification 🎉",
        message: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
        type: "success",
        isRead: false,
      },
      [
        `read("user:${user.$id}")`,
        `update("user:${user.$id}")`,
        `delete("user:${user.$id}")`,
      ],
    );

    return NextResponse.json({
      success: true,
      message: "Test notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    return NextResponse.json(
      {
        error: "Failed to create test notification",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

