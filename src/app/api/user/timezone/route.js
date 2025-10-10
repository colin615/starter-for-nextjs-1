import { createSessionClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Function to convert timezone to UTC offset
function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60); // hours
    
    // Format as UTC±HH:MM
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset);
    const minutes = Math.round((absOffset - hours) * 60);
    
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating timezone offset:', error);
    return '+00:00'; // Default to UTC
  }
}

export async function GET() {
  try {
    const { account } = await createSessionClient();
    
    try {
      const prefs = await account.getPrefs();
      
      return NextResponse.json({
        success: true,
        timezone: prefs.timezone || null,
        timezoneOffset: prefs.timezoneOffset || null
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } catch (error) {
      console.error("Get preferences error:", error);
      return NextResponse.json({
        success: true,
        timezone: null,
        timezoneOffset: null
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
  } catch (error) {
    console.error("Get timezone error:", error);
    return NextResponse.json(
      { error: "Failed to get timezone" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { timezone } = await request.json();
    
    if (!timezone) {
      return NextResponse.json(
        { error: "Timezone is required" },
        { status: 400 }
      );
    }

    const { account } = await createSessionClient();
    
    // Calculate UTC offset
    const timezoneOffset = getTimezoneOffset(timezone);
    
    // Get current preferences to preserve other settings
    let currentPrefs = {};
    try {
      currentPrefs = await account.getPrefs();
    } catch (error) {
      // If no preferences exist, start with empty object
      console.log("No existing preferences found, creating new ones");
    }
    
    // Update preferences with timezone data
    const updatedPrefs = {
      ...currentPrefs,
      timezone: timezone,
      timezoneOffset: timezoneOffset
    };
    
    const user = await account.updatePrefs(updatedPrefs);
    
    return NextResponse.json({
      success: true,
      user: user,
      timezone: timezone,
      timezoneOffset: timezoneOffset
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Save timezone error:", error);
    
    if (error.code === 401) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to save timezone" },
      { status: 500 }
    );
  }
}
