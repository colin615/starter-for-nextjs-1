import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID, Storage, Query } from "node-appwrite";

export async function GET(request) {
  try {
    const { tablesdb } = await createSessionClient();

    const services = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "services",
    });

    return NextResponse.json({
      services: services.rows,
    });
  } catch (error) {
    console.error("Fetch services error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching services" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { identifier } = payload;

    // Validate base input
    if (!identifier) {
      return NextResponse.json(
        { error: "Service identifier is required" },
        { status: 400 },
      );
    }

    // Get user
    const { account, tablesdb } = await createSessionClient();
    const user = await account.get();

    // Check if user has timezone set in preferences
    try {
      const prefs = await account.getPrefs();
      if (!prefs.timezone) {
        return NextResponse.json(
          { error: "Please set your timezone before connecting services. Go to your account settings to configure your timezone." },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error checking user preferences:", error);
      return NextResponse.json(
        { error: "Unable to verify timezone settings. Please try again." },
        { status: 500 }
      );
    }

    const service = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "services",
      queries: [Query.equal("identifier", [identifier])],
    });

    console.log(service);

    if (service.total != 1)
      return NextResponse.json({ error: "Unknown service" }, { status: 400 });

    // check here
    // Validate dynamic auth params from service definition
    const requiredAuthParams = Array.isArray(service?.rows?.[0]?.auth_params)
      ? service.rows[0].auth_params
      : [];

    const missingParams = requiredAuthParams.filter(
      (param) =>
        !(param in payload) ||
        payload[param] === undefined ||
        payload[param] === null ||
        payload[param] === "",
    );

    if (missingParams.length > 0) {
      return NextResponse.json(
        { error: `Missing required auth params: ${missingParams.join(", ")}` },
        { status: 400 },
      );
    }

    // Check if there's already a linked service with the same userId and identifier
    const existingLinks = await tablesdb.listRows({
      databaseId: "skapex-dash-db",
      tableId: "linked_apis",
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("identifier", [identifier]),
      ],
    });

    // Prepare auth data
    const authData = [];
    requiredAuthParams.forEach((param) => {
      let tempObj = {};
      tempObj[param] = payload[param];
      authData.push(JSON.stringify(tempObj));
    });

    console.log(authData);

    let row;
    if (existingLinks.total > 0) {
      // Update existing link
      const existingLink = existingLinks.rows[0];
      row = await tablesdb.updateRow({
        databaseId: "skapex-dash-db",
        tableId: "linked_apis",
        rowId: existingLink.$id,
        data: {
          auth_data: authData,
        },
      });
    } else {
      // Create new link
      row = await tablesdb.createRow({
        databaseId: "skapex-dash-db",
        tableId: "linked_apis",
        rowId: ID.unique(),
        data: {
          userId: user.$id,
          identifier,
          auth_data: authData,
        },
        permissions: [`read("user:${user.$id}")`, `write("user:${user.$id}")`],
      });
    }

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
