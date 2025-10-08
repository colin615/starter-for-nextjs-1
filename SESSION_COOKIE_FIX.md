# Session Cookie Fix - 401 Error Resolution

## Problem

After the initial auth refactor, we were still getting:
```
❌ AppwriteSessionProvider: Failed to get account after setting session 
AppwriteException: User (role: guests) missing scopes (["account"])
```

## Root Cause

The issue was trying to manually transfer a server-side session to the client using `client.setSession()`. This doesn't work because:

1. Server creates session with admin client
2. Session secret stored in httpOnly cookie
3. We tried to fetch that secret and set it on client with `client.setSession()`
4. **This doesn't work** - Appwrite's client SDK expects to manage its own session via cookies

## Solution

Instead of manually setting the session, we now use **Appwrite's built-in cookie-based authentication**:

### What Changed

#### 1. Login Route (`src/app/api/auth/login/route.js`)

**Now sets TWO cookies**:

```javascript
// Server-side session (httpOnly for security)
cookieStore.set("appwrite-session", session.secret, {
  httpOnly: true,  // Server-only access
  // ...
});

// Client-side session (for Appwrite SDK and realtime)
cookieStore.set(`a_session_${projectId}`, session.secret, {
  httpOnly: false,  // Client SDK needs access
  // ...
});
```

The cookie name `a_session_<projectId>` follows Appwrite's convention and is automatically recognized by the client SDK.

#### 2. Logout Route (`src/app/api/auth/logout/route.js`)

**Now clears BOTH cookies**:

```javascript
// Clear server-side session
cookieStore.set("appwrite-session", "", { maxAge: 0, ... });

// Clear client-side session  
cookieStore.set(`a_session_${projectId}`, "", { maxAge: 0, ... });
```

#### 3. AppwriteSessionProvider (`src/components/AppwriteSessionProvider.jsx`)

**Simplified - no more manual session setting**:

```javascript
// BEFORE (didn't work):
const response = await fetch("/api/auth/session");
const data = await response.json();
client.setSession(data.session);  // ❌ This failed
const userData = await account.get();

// AFTER (works!):
const userData = await account.get();  // ✅ SDK uses cookie automatically
```

The Appwrite SDK **automatically** looks for and uses the `a_session_<projectId>` cookie. We just need to verify authentication by calling `account.get()`.

## How It Works Now

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Logs In                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Server creates session via Appwrite API                 │
│     session = account.createEmailPasswordSession(...)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Server sets TWO cookies:                                │
│     • appwrite-session (httpOnly) - for server use          │
│     • a_session_<projectId> (regular) - for client SDK      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Client SDK automatically reads a_session_<projectId>    │
│     No manual intervention needed!                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. AppwriteSessionProvider verifies authentication:        │
│     const user = await account.get();  // ✅ Works!         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Realtime subscriptions work with proper permissions!    │
└─────────────────────────────────────────────────────────────┘
```

## Why Two Cookies?

| Cookie | httpOnly | Purpose |
|--------|----------|---------|
| `appwrite-session` | ✅ Yes | Server-side API routes, protected from XSS |
| `a_session_<projectId>` | ❌ No | Client SDK (including realtime), required by Appwrite |

**Security Note**: 
- The httpOnly cookie protects against XSS attacks for server operations
- The client cookie is necessary for Appwrite's SDK to function (realtime, etc.)
- Both cookies have the same session secret, just different accessibility

## Expected Console Output

After login, you should see:

```
🔐 AppwriteSessionProvider: Checking session...
✅ AppwriteSessionProvider: Client authenticated as 67xxxxxxxxxxxxx
🔔 Realtime is ready with authenticated user!
```

**No more "User (role: guests) missing scopes" errors!** ✅

## Testing

1. **Clear all cookies** in DevTools (Application → Cookies)
2. **Login** with valid credentials
3. **Check DevTools** → Application → Cookies:
   - Should see `appwrite-session` (httpOnly)
   - Should see `a_session_<your-project-id>`
4. **Check console** for success messages
5. **Test realtime** - notifications should work

## Key Takeaway

**Don't try to manually manage Appwrite session cookies**. Let Appwrite's SDK handle it by:

1. Setting the correctly-named cookie on the server (`a_session_<projectId>`)
2. Letting the client SDK automatically pick it up
3. Just verifying authentication with `account.get()`

This is the **official Appwrite pattern** for web authentication with realtime features.

