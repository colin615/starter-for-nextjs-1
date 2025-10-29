import { NextResponse } from 'next/server';
import { generatePKCE, buildKickAuthUrl } from '@/lib/kick-oauth';
import { createServerClient, getLoggedInUser } from '@/lib/server/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check if user is authenticated
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has timezone set
    const timezone = user.user_metadata?.timezone;
    if (!timezone) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=timezone_required', request.url));
    }

    // Generate PKCE parameters
    const { codeVerifier, codeChallenge } = generatePKCE();
    
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('base64url');
    
    // Store PKCE parameters and state in Supabase for later verification
    const supabase = await createServerClient();
    
    // Create a temporary record to store OAuth state
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state: state,
        code_verifier: codeVerifier,
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      return NextResponse.json(
        { error: 'Failed to initialize OAuth flow' },
        { status: 500 }
      );
    }

    // Build authorization URL
    const authUrl = buildKickAuthUrl(codeChallenge, state);

    // Redirect to Kick authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Kick OAuth authorization error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authorization' },
      { status: 500 }
    );
  }
}

