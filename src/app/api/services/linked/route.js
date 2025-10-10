import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { account, tablesdb } = await createSessionClient();
    const user = await account.get();

    // Fetch all linked_apis for this user
    const linkedApis = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "linked_apis",
      queries: [Query.equal("userId", [user.$id])],
    });

    return NextResponse.json({
      linked: linkedApis.rows,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Fetch linked services error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching linked services" },
      { status: 500 },
    );
  }
}

