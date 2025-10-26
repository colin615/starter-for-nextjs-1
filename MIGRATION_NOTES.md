# Supabase Auth Migration Notes

## Completed Migration

The authentication system has been migrated from Appwrite to Supabase. The following changes have been made:

### Files Updated

1. **Created new Supabase clients:**
   - `src/lib/supabase.js` - Client-side Supabase client
   - `src/lib/server/supabase.js` - Server-side Supabase client with admin functions

2. **Updated authentication flow:**
   - `src/contexts/AuthContext.js` - Now uses Supabase for auth state management
   - `src/app/api/auth/login/route.js` - Updated to use Supabase login
   - `src/app/api/auth/logout/route.js` - Updated to use Supabase logout
   - `src/app/api/auth/signup/route.js` - Updated to use Supabase signup
   - `src/components/auth/AuthGuard.jsx` - Updated to use Supabase auth check
   - `middleware.js` - Updated to use Supabase auth

3. **Updated pages:**
   - `src/app/login/page.js` - Changed branding from "Appwrite" to "Supabase"
   - `src/app/signup/page.js` - Changed branding from "Appwrite" to "Supabase"
   - `src/app/account/page.js` - Updated to use Supabase user structure
   - `src/app/dashboard/layout.js` - Updated to use Supabase user structure
   - `src/app/page.js` - Updated to use Supabase auth
   - `src/app/dashboard/page.jsx` - Updated to use Supabase auth

4. **Removed Appwrite files:**
   - `src/lib/appwrite.js` - Deleted
   - `src/lib/jwtCache.js` - Deleted
   - `src/lib/server/appwrite.js` - Deleted

### Environment Variables Required

Add these to your `.env.local`:

```env
# Public (client-accessible)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Still Using Appwrite Database

The following files still use Appwrite for database operations (not auth):

- `src/contexts/NotificationContext.js` - Uses Appwrite realtime for notifications
- `src/components/DashboardClient.jsx` - Uses Appwrite for data fetching
- `src/lib/server/profile.js` - Uses Appwrite TablesDB
- API routes in `src/app/api/` - Still use Appwrite for database queries

These files need to be migrated to Supabase database if you want to fully remove Appwrite.

## User Object Changes

The user object structure has changed:

**Appwrite user:**
```javascript
{
  $id: "user-id",
  email: "user@example.com",
  emailVerification: true
}
```

**Supabase user:**
```javascript
{
  id: "user-id",
  email: "user@example.com",
  email_confirmed_at: "2025-01-01T00:00:00Z"
}
```

## Next Steps

1. Set up Supabase project
2. Add environment variables
3. Test login/signup/logout flow
4. Migrate database operations if needed
5. Update NotificationContext for Supabase realtime subscriptions
6. Update DashboardClient for Supabase database queries

