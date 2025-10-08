import { createAdminClient, createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

/**
 * POST /api/notifications/create
 * Create a notification for a user
 *
 * Body:
 * {
 *   userId: string (required)
 *   title: string (required)
 *   message: string (optional)
 *   type: 'success' | 'error' | 'warning' | 'info' (optional, defaults to 'info')
 * }
 */
export async function POST(request) {
  try {
    // Get the current session to verify authentication
    const { account } = await createSessionClient();
    const user = await account.get();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message = "", type = "info" } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "userId and title are required" },
        { status: 400 },
      );
    }

    // Use admin client to create the notification
    const { databases } = await createAdminClient();

    const notification = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
      [
        `read("user:${userId}")`,
        `update("user:${userId}")`,
        `delete("user:${userId}")`,
      ],
    );

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification", details: error.message },
      { status: 500 },
    );
  }
}

