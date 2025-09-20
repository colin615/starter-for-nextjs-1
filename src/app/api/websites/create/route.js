import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";

export async function POST(request) {
  try {
    const { name, description, accentColor, icon } = await request.json();

    // Validate input
    if (!name || !accentColor) {
      return NextResponse.json(
        { error: "Name and accent color are required" },
        { status: 400 },
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or less" },
        { status: 400 },
      );
    }

    if (description && description.length > 200) {
      return NextResponse.json(
        { error: "Description must be 200 characters or less" },
        { status: 400 },
      );
    }

    // Get user
    const { account, tablesdb, storage } = await createSessionClient();
    const user = await account.get();

    let iconFileId = null;

    // Upload icon if provided
    if (icon) {
      // Assume icon is base64 or file data; in practice, handle multipart/form-data
      // For simplicity, assuming icon is a file ID or URL; adjust as needed
      // Here, we'll assume icon is uploaded separately or handle as base64
      // For now, skip upload and set to null; implement proper upload later
      iconFileId = null; // Placeholder
    }

    // Create row in websites table
    const row = await tablesdb.createRow({
      databaseId: "skapex-dash-db",
      tableId: "websites",
      rowId: ID.unique(),
      data: {
        userId: user.$id,
        name,
        description: description || "",
        accentColor,
        iconFileId,
      },
      permissions: [`read("user:${user.$id}")`, `write("user:${user.$id}")`],
    });

    return NextResponse.json({
      success: true,
      website: row,
    });
  } catch (error) {
    console.error("Create website error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the website" },
      { status: 500 },
    );
  }
}
