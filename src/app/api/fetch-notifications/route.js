import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function GET(request) {
  try {
    const { databases, account } = await createSessionClient();
    
    // Get current user
    const user = await account.get();
    console.log("Fetching notifications for user:", user.$id);

    // Fetch notifications with query for this user
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(50)
      ]
    );

    console.log(`Found ${response.documents.length} notifications for user ${user.$id}`);

    return NextResponse.json({
      success: true,
      notifications: response.documents,
      total: response.total,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { 
        error: error.message,
        type: error.type,
        code: error.code 
      },
      { status: 500 }
    );
  }
}

