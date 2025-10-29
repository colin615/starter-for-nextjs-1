# Kick OAuth Integration - Quick Start

This guide provides a quick reference for setting up and using the Kick.com OAuth integration.

## ✅ What's Been Implemented

1. **OAuth Routes**
   - `/api/auth/kick/authorize` - Initiates Kick OAuth flow
   - `/api/auth/kick/callback` - Handles OAuth callback

2. **UI Components**
   - Sidebar notice appears when Kick is not connected
   - Hidden when Kick is connected
   - Click "Connect" to start OAuth flow

3. **Database Schema**
   - `oauth_states` table for state management
   - `services` table entry for Kick
   - Integration with existing `linked_apis` table

4. **Security**
   - PKCE (Proof Key for Code Exchange) implementation
   - State verification for CSRF protection
   - Secure token storage in Supabase

## 🚀 Quick Setup (5 Minutes)

### 1. Get Kick Credentials

1. Go to [dev.kick.com](https://dev.kick.com)
2. Create/select your app
3. Set redirect URI: `http://localhost:3000/api/auth/kick/callback` (dev) or `https://yourdomain.com/api/auth/kick/callback` (prod)
4. Copy Client ID and Client Secret

### 2. Add Environment Variables

Add to `.env.local`:

```env
KICK_CLIENT_ID=your_client_id_here
KICK_CLIENT_SECRET=your_client_secret_here
KICK_REDIRECT_URI=http://localhost:3000/api/auth/kick/callback
```

### 3. Run Database Migration

**Option A: Supabase Dashboard**
- Open SQL Editor
- Copy contents from `supabase/migrations/add_kick_oauth.sql`
- Run the SQL

**Option B: Supabase CLI**
```bash
supabase db push
```

### 4. Test the Integration

```bash
npm run dev
```

Navigate to dashboard → Click "Connect" in sidebar → Complete OAuth flow

## 📁 Files Created/Modified

### New Files
- `src/lib/kick-oauth.js` - OAuth utilities
- `src/app/api/auth/kick/authorize/route.js` - Authorization endpoint
- `src/app/api/auth/kick/callback/route.js` - Callback handler
- `src/app/api/auth/kick/status/route.js` - Status check endpoint
- `KICK_OAUTH_SETUP.md` - Complete setup guide
- `KICK_OAUTH_QUICKSTART.md` - This file
- `supabase/migrations/add_kick_oauth.sql` - Database migration (oauth_connections + oauth_states)

### Important
Kick OAuth uses dedicated OAuth tables (`oauth_connections` and `oauth_states`). It does NOT use the `services` or `linked_apis` tables.

### Modified Files
- `src/components/app-sidebar.jsx` - Added Kick connection notice

## 🔄 OAuth Flow

```
User clicks "Connect"
  ↓
GET /api/auth/kick/authorize
  ↓
Generate PKCE + State
  ↓
Store in Supabase (oauth_states)
  ↓
Redirect to Kick OAuth
  ↓
User authorizes on Kick
  ↓
GET /api/auth/kick/callback?code=xxx&state=yyy
  ↓
Verify state + Exchange code for tokens
  ↓
Store tokens in linked_apis
  ↓
Redirect to dashboard (connected!)
```

## 🧪 Testing Checklist

- [ ] Environment variables set
- [ ] Database migration ran successfully
- [ ] Kick app created with correct redirect URI
- [ ] Development server starts without errors
- [ ] Sidebar shows "Connect" notice when not connected
- [ ] Clicking "Connect" redirects to Kick
- [ ] After authorization, redirects back to dashboard
- [ ] Sidebar notice disappears after connection
- [ ] Connected services page shows Kick as connected

## 🐛 Troubleshooting

### "Invalid redirect_uri"
- Check redirect URI matches exactly in Kick Dev Portal
- Verify protocol (http vs https)
- Ensure no trailing slashes

### Sidebar notice not appearing
- Check browser console for errors
- Verify Supabase connection
- Ensure user is logged in

### "Token exchange failed"
- Verify `KICK_CLIENT_SECRET` is correct
- Check PKCE implementation is working
- Review server logs for details

### Database errors
- Ensure migration ran successfully
- Check RLS policies are enabled
- Verify user has correct permissions

## 📚 Additional Resources

- [Kick API Documentation](https://docs.kick.com)
- [OAuth 2.1 Specification](https://oauth.net/2.1/)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [Supabase Documentation](https://supabase.com/docs)

## 🔐 Security Notes

- Uses PKCE for enhanced security
- State parameter prevents CSRF attacks
- Tokens stored securely in Supabase with RLS
- Client secret never exposed to browser
- Expired OAuth states automatically cleaned up

## 💡 Next Steps

After successful integration:

1. **Use Access Tokens**: Make Kick API calls with stored tokens
2. **Implement Refresh**: Automatically refresh expired tokens
3. **Add Revoke**: Allow users to disconnect their account
4. **Fetch Data**: Pull user/livestream data from Kick API
5. **Sync Stats**: Integrate with your statistics system

For detailed information, see `KICK_OAUTH_SETUP.md`.

