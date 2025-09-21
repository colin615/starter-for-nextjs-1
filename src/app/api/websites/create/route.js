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
    const { account, tablesdb, storage } = await createSessionClient();
    const storageClient = storage;
    const user = await account.get();

    let iconFileId = null;

    let logoFileURL = null;

    // Handle icon - it could be a file ID (already uploaded) or base64 data
    if (icon) {
      // If it's already a file ID (string without data: prefix), use it directly
      if (typeof icon === "string" && !icon.startsWith("data:")) {
        iconFileId = icon;
        logoFileURL = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/website-icons/files/${icon}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      } else {
        // Handle legacy base64 upload (fallback)
        try {
          let fileBuffer;
          let fileName = "website-icon.png";

          if (icon.startsWith("data:")) {
            const base64Data = icon.split(",")[1];
            fileBuffer = Buffer.from(base64Data, "base64");
          } else {
            fileBuffer = Buffer.from(icon);
          }

          const file = await storageClient.createFile(
            "website-icons",
            ID.unique(),
            new File([fileBuffer], fileName, { type: "image/png" }),
          );

          iconFileId = file.$id;
          logoFileURL = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/website-icons/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        } catch (error) {
          console.error("Error uploading icon:", error);
          iconFileId = null;
          logoFileURL = null;
        }
      }
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
        logoFileURL,
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
