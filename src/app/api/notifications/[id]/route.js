import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

/**
 * PATCH /api/notifications/[id]
 * Update a notification (mark as read/unread)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params; // Next.js 15 requires awaiting params
    const { account, databases } = await createSessionClient();
    const user = await account.get();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const notification = await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      id,
      body,
    );

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      {
        error: "Failed to update notification",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // Next.js 15 requires awaiting params
    const { account, databases } = await createSessionClient();
    const user = await account.get();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await databases.deleteDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      id,
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      {
        error: "Failed to delete notification",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

