import { createServerClient, getLoggedInUser } from "@/lib/server/supabase";
import { NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const supabase = await createServerClient();

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('enabled', true);

    if (error) throw error;

    return NextResponse.json({
      services: services || [],
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
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
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = await createServerClient();

    // Check if user has timezone set in user_metadata
    const timezone = user.user_metadata?.timezone;

    if (!timezone) {
      return NextResponse.json(
        { error: "Please set your timezone before connecting services. Go to your account settings to configure your timezone." },
        { status: 400 }
      );
    }

    // Get service definition
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('identifier', identifier)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Unknown service" }, { status: 400 });
    }

    // Disallow linking to disabled services
    if (service.enabled === false) {
      return NextResponse.json(
        { error: "This service is currently disabled" },
        { status: 400 }
      );
    }

    // Validate dynamic auth params from service definition
    const requiredAuthParams = Array.isArray(service?.auth_params)
      ? service.auth_params
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

    // Prepare auth data object
    const authData = {};
    requiredAuthParams.forEach((param) => {
      authData[param] = payload[param];
    });

    // Check if there's already a linked service with the same userId and identifier
    const { data: existingLinks, error: existingError } = await supabase
      .from('linked_apis')
      .select('*')
      .eq('user_id', user.id)
      .eq('identifier', identifier);

    if (existingError) {
      console.error("Error checking existing links:", existingError);
    }

    let linkedApi;

    if (existingLinks && existingLinks.length > 0) {
      // Update existing link
      const { data: updatedLink, error: updateError } = await supabase
        .from('linked_apis')
        .update({
          auth_data: authData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLinks[0].id)
        .select()
        .single();

      if (updateError) throw updateError;
      linkedApi = updatedLink;
    } else {
      // Create new link
      const { data: newLink, error: insertError } = await supabase
        .from('linked_apis')
        .insert({
          user_id: user.id,
          identifier: identifier,
          auth_data: authData,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      linkedApi = newLink;
    }

    // Immediately trigger backfill
    console.log('Triggering backfill for linked API:', linkedApi.id);

    const { data: backfillResult, error: backfillError } = await supabase.functions.invoke('backfill-v2', {
      body: {
        userId: linkedApi.user_id,
        identifier: linkedApi.identifier,
        "startDate": "2025-01-20T00:00:00.000Z",
        "endDate": "2025-01-27T23:59:59.999Z"
      }
    });

    if (backfillError) {
      console.error('Backfill failed:', backfillError);
      // Don't fail the whole request if backfill fails
      // The user can manually trigger backfill later if needed
    } else {
      console.log('Backfill started successfully:', backfillResult);
    }

    return NextResponse.json({
      success: true,
      linked_api: linkedApi,
      backfill_triggered: !backfillError,
    });
  } catch (error) {
    console.error("Link service error:", error);
    return NextResponse.json(
      { error: "An error occurred while linking the service" },
      { status: 500 },
    );
  }
}
