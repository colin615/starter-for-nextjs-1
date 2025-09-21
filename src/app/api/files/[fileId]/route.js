import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const { storage } = await createSessionClient();

    // Get the file from Appwrite storage
    const file = await storage.getFileView(
      "website-icons", // bucket ID
      fileId,
    );

    // Return the file with appropriate headers
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/*",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
