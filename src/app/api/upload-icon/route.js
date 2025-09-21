import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID, Permission } from "node-appwrite";

export async function POST(request) {
  try {
    const { storage } = await createSessionClient();

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    // Upload to Appwrite storage with public read permissions
    const uploadedFile = await storage.createFile(
      "website-icons",
      ID.unique(),
      file,
      [Permission.read("any")], // Make file publicly readable
    );

    // Get the file URL
    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/website-icons/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.$id,
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
