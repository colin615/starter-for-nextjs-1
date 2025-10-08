# Authentication System - Fixed Implementation

## Overview

The authentication system has been completely refactored to properly handle both server-side and client-side authentication with Appwrite.

## Architecture

### Server-Side Authentication (httpOnly cookies)

- **Login/Signup**: API routes create sessions and store them in httpOnly cookies
- **Session Management**: Server-side API routes use `createSessionClient()` from `@/lib/server/appwrite`
- **Security**: httpOnly cookies prevent XSS attacks

### Client-Side Authentication (for Realtime)

- **AppwriteSessionProvider**: Fetches the session from the server and sets it on the client SDK
- **AuthContext**: Provides auth state throughout the app
- **NotificationCenter**: Uses the authenticated client for realtime subscriptions

## Components

### 1. AppwriteSessionProvider (`src/components/AppwriteSessionProvider.jsx`)

**Purpose**: Bridges server-side session (httpOnly cookie) with client-side Appwrite SDK

**Features**:
- Fetches session token from `/api/auth/session` endpoint
- Sets session on client SDK using `client.setSession()`
- Verifies authentication with `account.get()`
- Provides context with: `isReady`, `userId`, `user`, `isAuthenticated`

**Hook**: `useAppwriteSession()`

```javascript
const { isReady, userId, user, isAuthenticated } = useAppwriteSession();
```

### 2. AuthContext (`src/contexts/AuthContext.js`)

**Purpose**: Unified auth interface for the application

**Features**:
- Wraps `AppwriteSessionProvider` for convenience
- Provides `user`, `loading`, `logout`, `checkAuth`, `isAuthenticated`
- Uses API routes for logout (maintains server-side session management)

**Hook**: `useAuth()`

```javascript
const { user, loading, logout, isAuthenticated } = useAuth();
```

### 3. Providers Order (`src/components/providers.jsx`)

**Critical**: Providers must be in this order:

```javascript
<AppwriteSessionProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</AppwriteSessionProvider>
```

`AuthContext` depends on `AppwriteSessionProvider`, so it must be nested inside.

## API Routes

### `/api/auth/session` (GET)

- Reads httpOnly cookie `appwrite-session`
- Returns session token to authenticated client
- Used by `AppwriteSessionProvider` to initialize client SDK

### `/api/auth/login` (POST)

- Creates email/password session
- Stores session secret in httpOnly cookie
- Returns success response

### `/api/auth/logout` (POST)

- Deletes current session in Appwrite
- Clears httpOnly cookie
- Client redirects to `/login`

### `/api/auth/signup` (POST)

- Creates new user account
- Does NOT create session (user must login after signup)

## Realtime Subscriptions

### How It Works

1. User logs in → Session stored in httpOnly cookie
2. `AppwriteSessionProvider` fetches session from `/api/auth/session`
3. Sets session on client SDK with `client.setSession()`
4. Client SDK is now authenticated
5. Realtime subscriptions work with proper user permissions

### NotificationCenter Example

```javascript
export function NotificationCenter() {
  const { isReady, userId, isAuthenticated } = useAppwriteSession();
  
  React.useEffect(() => {
    if (!userId || !isReady || !isAuthenticated) {
      return; // Wait for authentication
    }
    
    // Subscribe to realtime with authenticated client
    const unsubscribe = client.subscribe(
      [`databases.${DB}.collections.${COLL}.documents`],
      (response) => {
        // Handle realtime events
      }
    );
    
    return () => unsubscribe();
  }, [userId, isReady, isAuthenticated]);
}
```

## Why This Works

### Previous Issues

1. ❌ `AuthContext` tried to call `account.get()` directly → 401 (no session on client)
2. ❌ `AppwriteSessionProvider` didn't properly verify authentication
3. ❌ Providers were in wrong order
4. ❌ Race conditions between session init and component mounting

### Current Solution

1. ✅ Server manages sessions securely with httpOnly cookies
2. ✅ Client gets session token through safe API route
3. ✅ `AppwriteSessionProvider` properly initializes and verifies client authentication
4. ✅ `AuthContext` delegates to `AppwriteSessionProvider` (single source of truth)
5. ✅ Proper provider nesting ensures hooks work correctly
6. ✅ Components wait for `isReady` before attempting authenticated operations

## Security Considerations

### httpOnly Cookies

- ✅ Prevents XSS attacks (JavaScript cannot access)
- ✅ Automatically included in API requests
- ✅ Managed entirely server-side

### Session Token Exposure

The session token is exposed to client-side JavaScript via `/api/auth/session`:

- ✅ Only sent to authenticated requests (must have valid httpOnly cookie)
- ✅ Required for Appwrite realtime subscriptions to work
- ✅ Token is session-specific and expires with session
- ⚠️ Client-side code can access this token (necessary for realtime)

**Note**: This is a necessary trade-off to enable realtime features. The alternative would be to not use realtime subscriptions at all.

## Migration Guide

If you have existing components using auth:

### Before

```javascript
// Old way - Direct SDK calls
import { account } from '@/lib/appwrite';

function MyComponent() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    account.get()  // ❌ This fails - no session on client
      .then(setUser)
      .catch(console.error);
  }, []);
}
```

### After

```javascript
// New way - Use hooks
import { useAuth } from '@/contexts/AuthContext';
// or
import { useAppwriteSession } from '@/components/AppwriteSessionProvider';

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();
  // or
  const { user, isReady, isAuthenticated } = useAppwriteSession();
  
  if (loading || !isReady) return <Loading />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <div>Welcome {user.name}!</div>;
}
```

## Testing

To test the auth system:

1. **Login Flow**:
   - Navigate to `/login`
   - Enter credentials
   - Check browser console for "✅ AppwriteSessionProvider: Client authenticated as [userId]"
   - Verify redirect to `/dashboard`

2. **Session Persistence**:
   - Refresh page
   - Should remain logged in
   - Check that realtime subscriptions work

3. **Logout Flow**:
   - Click logout
   - Session cleared
   - Redirect to `/login`

4. **Realtime (NotificationCenter)**:
   - Login
   - Wait for "✅ Realtime: Subscribed successfully with authenticated client"
   - Create a test notification (use TestNotificationButton)
   - Should appear in real-time without page refresh

## Troubleshooting

### "401 Unauthorized" Errors

**Cause**: Client SDK trying to make authenticated requests without session

**Solution**: Ensure component waits for `isReady` before making requests

```javascript
const { isReady, isAuthenticated } = useAppwriteSession();

if (!isReady || !isAuthenticated) {
  return <Loading />;
}
```

### Realtime Not Receiving Events

**Cause**: Client not authenticated before subscribing

**Solution**: Check console for authentication success message:
```
✅ AppwriteSessionProvider: Client authenticated as [userId]
✅ Realtime: Subscribed successfully with authenticated client
```

If not present, check:
1. Is user logged in?
2. Is session cookie set? (Check DevTools → Application → Cookies)
3. Is `/api/auth/session` returning a session?

### Provider Order Issues

**Symptom**: "useAppwriteSession must be used within AppwriteSessionProvider"

**Solution**: Ensure `AppwriteSessionProvider` wraps `AuthProvider` in `providers.jsx`

## Summary

The new auth system provides:

- ✅ Secure server-side session management
- ✅ Client-side SDK authentication for realtime
- ✅ Single source of truth for auth state
- ✅ Proper loading states and error handling
- ✅ Clean, predictable API for components

All authentication concerns are handled by the two main hooks:
- `useAuth()` - for general authentication needs
- `useAppwriteSession()` - for fine-grained control or realtime features

