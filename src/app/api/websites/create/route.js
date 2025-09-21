import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID, Storage } from "node-appwrite";

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
    const { account, tablesdb } = await createSessionClient();
    const user = await account.get();

    // Validate icon is a file ID (should be uploaded separately)
    let iconFileId = null;
    if (icon && typeof icon === "string" && !icon.startsWith("data:")) {
      iconFileId = icon;
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
