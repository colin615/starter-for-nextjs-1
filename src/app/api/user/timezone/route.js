import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/server/supabase";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const supabase = await createServerClient();
    
    // Try to get user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // Try to get session instead
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Use user from session
      const timezone = session.user.user_metadata?.timezone || null;
      return NextResponse.json({
        success: true,
        timezone: timezone,
        timezoneOffset: null
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // Get timezone from user metadata
    const timezone = user.user_metadata?.timezone || null;
    
    return NextResponse.json({
      success: true,
      timezone: timezone,
      timezoneOffset: null
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Get timezone error:", error);
    }
    return NextResponse.json(
      { error: "Failed to get timezone" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerClient();
    
    // Get the logged-in user
    let user;
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !authUser) {
      // Try to get session instead
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      user = session.user;
    } else {
      user = authUser;
    }

    const { timezone } = await request.json();
    
    // Validate timezone input
    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json(
        { error: "Timezone is required" },
        { status: 400 }
      );
    }

    // Sanitize timezone string - only allow valid timezone characters
    // Valid timezone format: Continent/City or GMT offset
    const timezoneRegex = /^[A-Za-z/_-]+$/;
    if (!timezoneRegex.test(timezone) || timezone.length > 100) {
      return NextResponse.json(
        { error: "Invalid timezone format" },
        { status: 400 }
      );
    }

    // Update user metadata with timezone
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...(user.user_metadata || {}),
        timezone: timezone
      }
    });

    if (updateError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Update user error:", updateError);
      }
      return NextResponse.json(
        { error: "Failed to save timezone" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      timezone: timezone,
      timezoneOffset: null
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Save timezone error:", error);
    }
    
    return NextResponse.json(
      { error: "Failed to save timezone" },
      { status: 500 }
    );
  }
}
