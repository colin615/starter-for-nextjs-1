import { createServerClient, getLoggedInUser } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    const { identifier } = payload;

    // Validate input
    if (!identifier) {
      return NextResponse.json(
        { error: "Service identifier is required" },
        { status: 400 },
      );
    }

    // Get user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = await createServerClient();

    // Get session for JWT authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Failed to get authentication session" },
        { status: 401 },
      );
    }

    // Check if linked_api document exists
    const { data: linkedApis, error: fetchError } = await supabase
      .from('linked_apis')
      .select('*')
      .eq('user_id', user.id)
      .eq('identifier', identifier);

    if (fetchError) throw fetchError;

    if (!linkedApis || linkedApis.length === 0) {
      return NextResponse.json(
        { error: "No linked service found" },
        { status: 404 },
      );
    }

    // Call the reset Supabase function with JWT authentication
    const { data, error: functionError } = await supabase.functions.invoke('reset', {
      body: {
        userId: user.id,
        identifier: identifier,
        jwt: session.access_token,
      }
    });

    if (functionError) {
      console.error("Reset function error:", functionError);
      return NextResponse.json(
        { error: "Failed to reset service data" },
        { status: 500 },
      );
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || "Failed to reset service data" },
        { status: 500 },
      );
    }

    console.log(`Unlinked service ${identifier} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: data.message || "Service unlinked successfully",
    });
  } catch (error) {
    console.error("Unlink service error:", error);
    return NextResponse.json(
      { error: "An error occurred while unlinking the service" },
      { status: 500 },
    );
  }
}

