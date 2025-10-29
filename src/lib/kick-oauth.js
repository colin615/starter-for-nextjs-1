import crypto from 'crypto';

/**
 * Generate PKCE code verifier and challenge
 * Following RFC 7636 (Proof Key for Code Exchange)
 */
export function generatePKCE() {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  
  // Generate code challenge from verifier using SHA256
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

/**
 * Build Kick OAuth authorization URL
 */
export function buildKickAuthUrl(codeChallenge, state) {
  // Request scopes: user info, channel info, and KICKs info
  const scopes = [
    'user:read',      // Read user information
    'channel:read',   // Read channel information
    'kicks:read'      // Read KICKs info (leaderboards, etc.)
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.KICK_CLIENT_ID,
    redirect_uri: process.env.KICK_REDIRECT_URI,
    scope: scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  return `https://id.kick.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code, codeVerifier) {
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KICK_CLIENT_ID,
      client_secret: process.env.KICK_CLIENT_SECRET,
      redirect_uri: process.env.KICK_REDIRECT_URI,
      code: code,
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.KICK_CLIENT_ID,
      client_secret: process.env.KICK_CLIENT_SECRET,
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return await response.json();
}

/**
 * Revoke a token
 */
export async function revokeToken(token, tokenType = 'access_token') {
  const response = await fetch(`https://id.kick.com/oauth/revoke?token=${token}&token_hint_type=${tokenType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token revocation failed: ${error}`);
  }

  return true;
}

/**
 * Fetch user profile information from Kick API
 * Uses the official Kick API endpoint: https://api.kick.com/public/v1/users
 * When no user IDs are specified, returns the currently authorized user
 * Documentation: https://docs.kick.com/apis/users
 */
export async function getKickUserProfile(accessToken) {
  const response = await fetch('https://api.kick.com/public/v1/users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user profile: ${error}`);
  }

  const result = await response.json();
  
  // API returns { data: [{ user_id, name, email, profile_picture }], message: "text" }
  // When querying without IDs, it returns the current user as the first item in the array
  if (result.data && Array.isArray(result.data) && result.data.length > 0) {
    const userData = result.data[0];
    // Log the actual response structure for debugging
    console.log('Kick Users API response:', JSON.stringify(userData, null, 2));
    return userData;
  }
  
  throw new Error('No user data returned from API');
}

/**
 * Fetch channel information from Kick API
 * Uses the official Kick API endpoint: https://api.kick.com/public/v1/channels
 * When no parameters are provided, returns information for the currently authenticated user
 * Documentation: https://docs.kick.com/apis/channels
 */
export async function getKickChannelInfo(accessToken) {
  const response = await fetch('https://api.kick.com/public/v1/channels', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch channel info: ${error}`);
  }

  const result = await response.json();
  
  // API returns { data: [{ broadcaster_user_id, slug, banner_picture, ... }], message: "text" }
  // When querying without parameters, it returns the current user's channel as the first item
  if (result.data && Array.isArray(result.data) && result.data.length > 0) {
    const channelData = result.data[0];
    // Log the actual response structure for debugging
    console.log('Kick Channels API response:', JSON.stringify(channelData, null, 2));
    return channelData;
  }
  
  return null;
}

/**
 * Fetch comprehensive user profile combining Users and Channels APIs
 * Returns merged data from both endpoints for complete profile information
 */
export async function getKickFullProfile(accessToken) {
  try {
    // Fetch both user profile and channel info in parallel
    const [userProfile, channelInfo] = await Promise.all([
      getKickUserProfile(accessToken).catch(err => {
        console.warn('Failed to fetch user profile:', err);
        return null;
      }),
      getKickChannelInfo(accessToken).catch(err => {
        console.warn('Failed to fetch channel info:', err);
        return null;
      })
    ]);

    // Merge the data, prioritizing user profile data
    const mergedProfile = {
      ...userProfile,
      ...(channelInfo && {
        broadcaster_user_id: channelInfo.broadcaster_user_id,
        channel_slug: channelInfo.slug,
        channel_description: channelInfo.channel_description,
        banner_picture: channelInfo.banner_picture,
      })
    };

    // Try to find profile picture from various possible field names
    // Check user profile first, then channel info, with multiple field name variations
    const profilePicture = 
      userProfile?.profile_picture || 
      userProfile?.avatar || 
      userProfile?.avatar_url ||
      userProfile?.profile_image ||
      channelInfo?.profile_picture ||
      channelInfo?.avatar ||
      channelInfo?.banner_picture || // Fallback to banner if no profile pic
      null;

    mergedProfile.profile_picture = profilePicture;

    // Log merged profile for debugging
    console.log('Merged Kick profile:', JSON.stringify(mergedProfile, null, 2));

    return mergedProfile;
  } catch (error) {
    console.error('Error fetching full Kick profile:', error);
    throw error;
  }
}

