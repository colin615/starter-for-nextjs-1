import { NextResponse } from 'next/server';
import { createServerClient, getLoggedInUser } from '@/lib/server/supabase';
import { exchangeCodeForToken } from '@/lib/kick-oauth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Kick OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/connected-sites?error=oauth_failed', request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/connected-sites?error=invalid_request', request.url)
      );
    }

    // Get authenticated user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const supabase = await createServerClient();

    // Retrieve stored OAuth state and verify
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('state', state)
      .single();

    if (stateError || !oauthState) {
      console.error('Invalid or expired OAuth state:', stateError);
      return NextResponse.redirect(
        new URL('/dashboard/connected-sites?error=invalid_state', request.url)
      );
    }

    // Check if state has expired
    if (new Date(oauthState.expires_at) < new Date()) {
      return NextResponse.redirect(
        new URL('/dashboard/connected-sites?error=state_expired', request.url)
      );
    }

    // Exchange authorization code for tokens
    let tokenData;
    try {
      tokenData = await exchangeCodeForToken(code, oauthState.code_verifier);
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(
        new URL('/dashboard/connected-sites?error=token_exchange_failed', request.url)
      );
    }

    // Calculate expiration time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Check if user already has Kick connection
    const { data: existingConnection, error: existingError } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'kick')
      .single();

    let connection;

    if (existingConnection) {
      // Update existing connection
      const { data: updatedConnection, error: updateError } = await supabase
        .from('oauth_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt?.toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (updateError) throw updateError;
      connection = updatedConnection;
    } else {
      // Create new connection
      const { data: newConnection, error: insertError } = await supabase
        .from('oauth_connections')
        .insert({
          user_id: user.id,
          provider: 'kick',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt?.toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope
        })
        .select()
        .single();

      if (insertError) throw insertError;
      connection = newConnection;
    }

    // Clean up OAuth state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('id', oauthState.id);

    // Note: Backfill integration can be added here if needed
    // For now, tokens are stored and ready to use for API calls

    // Redirect back to connected sites page
    return NextResponse.redirect(
      new URL('/dashboard/connected-sites?success=kick_connected', request.url)
    );
  } catch (error) {
    console.error('Kick OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/connected-sites?error=unexpected_error', request.url)
    );
  }
}

