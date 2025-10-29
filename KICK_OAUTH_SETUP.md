# Kick.com OAuth Setup Guide

This guide walks you through setting up Kick.com OAuth integration using Supabase.

## Overview

The Kick OAuth flow allows users to connect their Kick.com accounts to the dashboard. This integration follows OAuth 2.1 standards with PKCE (Proof Key for Code Exchange) for enhanced security.

**Important:** Kick OAuth integration uses dedicated OAuth tables (`oauth_connections` and `oauth_states`). It does NOT use the `services` or `linked_apis` tables. This is a standalone OAuth integration.

## Prerequisites

- Supabase project set up
- Kick Developer account (https://dev.kick.com)
- Next.js application running

## Step 1: Create Kick Application

1. Go to [Kick Developer Portal](https://dev.kick.com)
2. Click "Create App" or navigate to your app
3. Fill in the required information:
   - **App Name**: Your application name
   - **Redirect URI**: `https://yourdomain.com/api/auth/kick/callback`
   - **Scopes**: The integration requests these scopes automatically:
     - `user:read` - Read user information
     - `channel:read` - Read channel information
     - `kicks:read` - Read KICKs info (leaderboards, etc.)
4. Note down your:
   - **Client ID**
   - **Client Secret**

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Kick OAuth Credentials
KICK_CLIENT_ID=your_kick_client_id
KICK_CLIENT_SECRET=your_kick_client_secret
KICK_REDIRECT_URI=https://yourdomain.com/api/auth/kick/callback

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important Notes**:
- Replace `yourdomain.com` with your actual domain
- For local development, use `http://localhost:3000/api/auth/kick/callback`
- Make sure the redirect URI in your Kick app settings matches exactly
- Restart your development server after adding environment variables

## Step 3: Supabase Database Setup

### Option A: Using Supabase Dashboard

1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL migration to create the OAuth state management tables

### Option B: Using Supabase CLI

1. Make sure you have Supabase CLI installed:
```bash
npm install -g supabase
```

2. Apply the migration:
```bash
supabase db push
```

## Step 4: Verify Database Schema

**Note:** Kick OAuth uses dedicated OAuth tables that are created by the migration. No entries in `services` or `linked_apis` tables are needed.

The migration creates two tables:

### `oauth_states` - Temporary OAuth flow state:

```sql
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_state ON oauth_states(user_id, state);

-- Add RLS policies
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own OAuth states"
  ON oauth_states
  FOR ALL
  USING (auth.uid() = user_id);

-- Optional: Create a function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Schedule automatic cleanup (runs every hour)
-- You can use pg_cron extension if available
-- SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_expired_oauth_states()');
```

### `oauth_connections` - OAuth token storage:

```sql
CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

## Step 5: Testing the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to your dashboard
3. Look for the Kick connection notice in the sidebar
4. Click "Connect" to start the OAuth flow
5. Complete the Kick authorization
6. You should be redirected back and see Kick as connected

## How It Works

### OAuth Flow Overview

1. **User clicks "Connect"** → Initiate OAuth request
2. **Authorization** → User redirected to Kick.com to authorize
3. **Callback** → Kick redirects back with authorization code
4. **Token Exchange** → Exchange code for access/refresh tokens
5. **Storage** → Store tokens in Supabase `linked_apis` table
6. **Backfill** → Trigger historical data fetch (if configured)

### Flow Diagram

```
User → Click Connect → /api/auth/kick/authorize
                    ↓
User → Authorize on Kick.com
                    ↓
Kick → Redirect to /api/auth/kick/callback?code=xxx
                    ↓
Server → Exchange code for tokens
                    ↓
Server → Store tokens in Supabase
                    ↓
Server → Redirect back to dashboard
```

## Troubleshooting

### Common Issues

**1. "Invalid redirect_uri"**
- Ensure your redirect URI in Kick Dev Portal matches exactly
- Check protocol (http vs https)
- Ensure no trailing slashes

**2. "Invalid client_id"**
- Verify `KICK_CLIENT_ID` is set correctly in `.env.local`
- Restart your dev server after changing env vars

**3. "Code exchange failed"**
- Check `KICK_CLIENT_SECRET` is correct
- Verify PKCE verification is working

**4. "Connection not found"**
- Check Supabase connection
- Verify oauth_connections table exists
- Run the migration if not already applied

**5. Sidebar notice still showing**
- Check if oauth_connections has a record for user + provider 'kick'
- Verify the `/api/auth/kick/status` endpoint is working
- Refresh the page

## Security Considerations

- ✅ Uses PKCE (Proof Key for Code Exchange) for enhanced security
- ✅ Tokens stored securely in Supabase with RLS policies
- ✅ Client secret never exposed to browser
- ✅ Refresh tokens automatically managed
- ✅ Tokens scoped to user-specific data

## Next Steps

After successful connection:

1. **Access Tokens**: Use stored tokens to make Kick API calls
2. **Backfill**: Historical data can be fetched using Kick API
3. **Refresh Tokens**: Automatically refresh when expired
4. **Revoke**: Allow users to disconnect their Kick account

## API Reference

### Kick OAuth Endpoints

- **Authorization**: `https://id.kick.com/oauth/authorize`
- **Token Exchange**: `https://id.kick.com/oauth/token`
- **Revoke Token**: `https://id.kick.com/oauth/revoke`

### Scopes

The integration requests these scopes by default:
- `user:read` - Read user information (username, streamer ID, etc.)
- `channel:read` - Read channel information (description, category, etc.)
- `kicks:read` - Read KICKs info (leaderboards, etc.)

Additional available scopes (can be added if needed):
- `channel:write` - Update channel info
- `chat:write` - Send chat messages
- `streamkey:read` - Read stream key
- `events:subscribe` - Subscribe to channel events
- `moderation:ban` - Execute moderation actions

## Support

For issues with:
- **Kick API**: Check [Kick Developer Docs](https://docs.kick.com)
- **Supabase**: Check [Supabase Docs](https://supabase.com/docs)
- **This Integration**: Review error logs in Supabase function logs

