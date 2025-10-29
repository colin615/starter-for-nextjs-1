import { NextResponse } from 'next/server';
import { createServerClient, getLoggedInUser } from '@/lib/server/supabase';
import { getKickFullProfile, refreshAccessToken } from '@/lib/kick-oauth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check if user is authenticated
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Check if user has Kick connection
    const { data: connection, error } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'kick')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking Kick connection:', error);
      return NextResponse.json({ connected: false }, { status: 500 });
    }

    if (!connection) {
      return NextResponse.json({ 
        connected: false 
      });
    }

    // Try to fetch user profile from Kick API
    let userProfile = null;
    let accessToken = connection.access_token;

    try {
      // Check if token is expired and refresh if needed
      if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
        if (connection.refresh_token) {
          try {
            const tokenData = await refreshAccessToken(connection.refresh_token);
            accessToken = tokenData.access_token;
            
            // Update connection with new token
            const expiresAt = tokenData.expires_in 
              ? new Date(Date.now() + tokenData.expires_in * 1000)
              : null;
            
            await supabase
              .from('oauth_connections')
              .update({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || connection.refresh_token,
                expires_at: expiresAt?.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', connection.id);
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Continue with old token, might still work
          }
        }
      }

      // Fetch comprehensive user profile (includes channel data)
      userProfile = await getKickFullProfile(accessToken);
    } catch (profileError) {
      console.error('Failed to fetch Kick user profile:', profileError);
      // Return connected status even if profile fetch fails
    }

    console.log('Kick user profile:', userProfile);

    return NextResponse.json({ 
      connected: true,
      user: userProfile ? {
        id: userProfile.user_id || userProfile.broadcaster_user_id,
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.profile_picture || userProfile.banner_picture || null,
        channelSlug: userProfile.channel_slug || null,
      } : null
    });
  } catch (error) {
    console.error('Kick status check error:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}

