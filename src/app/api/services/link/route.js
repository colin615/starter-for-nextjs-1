import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID, Storage, Query } from "node-appwrite";

export async function POST(request) {
    try {
        const { identifier, api_key } = await request.json();

        // Validate input
        if (!identifier || !api_key) {
            return NextResponse.json(
                { error: "Service identifier and api_key are required" },
                { status: 400 },
            );
        }

        // Get user
        const { account, tablesdb } = await createSessionClient();
        const user = await account.get();

        const service = await tablesdb.listRows({
            databaseId: "skapex-dash-db",
            tableId: process.env.NEXT_APPWRITE_DB_SERVICES_ID,
            queries: [Query.equal('identifier', [identifier])]
        })

        if (service.total != 1) return NextResponse.json(
            { error: "Unknown service" },
            { status: 400 },
        );



       

        // Create row in websites table
        const row = await tablesdb.createRow({
            databaseId: "skapex-dash-db",
            tableId: "linked_apis",
            rowId: ID.unique(),
            data: {
                userId: user.$id,
                identifier,
                api_key
            },
            permissions: [`read("user:${user.$id}")`, `write("user:${user.$id}")`],
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Create website error:", error);
        return NextResponse.json(
            { error: "An error occurred while creating the website" },
            { status: 500 },
        );
    }
}
