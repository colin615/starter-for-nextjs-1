# Fix: User (role: guests) missing scopes

## The Problem

Error: `User (role: guests) missing scopes (["account"])`

This error means **your localhost is NOT configured as a platform in Appwrite Console**.

## Why This Happens

Appwrite uses a **platform whitelist** for security. When you try to create a session from the browser:

1. Browser sends request to Appwrite Cloud
2. Appwrite checks: "Is this domain allowed to access this project?"
3. If NO → Treats user as "guest" (no permissions)
4. Session creation fails

## The Fix

### Step 1: Open Appwrite Console

1. Go to: https://cloud.appwrite.io
2. Login to your account
3. Open your project (ID: `68c4f57f002d57cb79c0`)

### Step 2: Add Platform

1. Click **Settings** (⚙️) in the left sidebar
2. Click **Platforms** tab
3. Click **Add Platform** button
4. Select **Web App**

### Step 3: Configure Platform

**CRITICAL: Use the EXACT settings below**

#### For Localhost Development:

```
Name: Local Development
Hostname: localhost
```

**DO NOT include:**
- ❌ http:// or https://
- ❌ Port number (:3000)
- ❌ Trailing slash (/)

**Just:** `localhost`

#### For Production (when you deploy):

```
Name: Production
Hostname: yourdomain.com
```

Again, just the hostname - no protocol, no www, no paths.

### Step 4: Save and Test

1. Click **Next** / **Create** to save the platform
2. **Wait 10-20 seconds** for it to propagate
3. **Refresh your app** in the browser
4. Try logging in again

## Verification

### Check if Platform is Added

In Appwrite Console:
- Settings → Platforms
- Should see your platform listed
- Hostname should be exactly `localhost` (or your domain)

### Test the Connection

Open the test file I created:

```bash
# In your project directory
open test-appwrite-connection.html
```

Or just open it in your browser and follow the prompts.

## Common Mistakes

### ❌ Wrong: Using full URL
```
Hostname: http://localhost:3000
```

### ✅ Correct: Just hostname
```
Hostname: localhost
```

### ❌ Wrong: Including port
```
Hostname: localhost:3000
```

### ✅ Correct: No port
```
Hostname: localhost
```

### ❌ Wrong: Including protocol
```
Hostname: https://myapp.com
```

### ✅ Correct: Just domain
```
Hostname: myapp.com
```

## Why Each Domain Needs to be Added

Appwrite requires you to add each domain separately for security:

- `localhost` for local development
- `yourdomain.com` for production
- `staging.yourdomain.com` for staging
- etc.

This prevents unauthorized websites from accessing your Appwrite project.

## After Adding Platform

Once the platform is added:

1. **Refresh your browser** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. **Clear any stored data** (or use incognito)
3. **Try logging in again**
4. Should see:
   ```
   🔐 Authenticating client SDK...
   ✅ Client SDK authenticated for user: [userId]
   ```

## Still Not Working?

### Check Console Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Look for request to `fra.cloud.appwrite.io`
5. Check the response

**If you see:**
- Status 401
- Response: "User (role: guests)"
- **Platform is still not configured correctly**

**Double-check:**
1. Hostname is exactly `localhost` (no extras)
2. You saved the platform
3. You waited 10-20 seconds
4. You refreshed the page

### Check Browser Console

Look for CORS errors:
```
Access to fetch at 'https://fra.cloud.appwrite.io/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

If you see CORS errors → Platform is definitely not configured.

### Verify Project ID

In your `.env.local`:
```
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68c4f57f002d57cb79c0
```

Make sure this matches your Appwrite Console project ID.

## Complete Setup Checklist

For localhost development:

- [ ] Platform added in Appwrite Console
- [ ] Platform type: Web App
- [ ] Hostname: `localhost` (exactly)
- [ ] Platform saved successfully
- [ ] Waited 10-20 seconds
- [ ] Browser refreshed (hard refresh)
- [ ] Storage cleared (or using incognito)
- [ ] Environment variables correct
- [ ] Dev server restarted

## Screenshot Guide

I can't show screenshots here, but here's what to look for:

**Appwrite Console Path:**
```
Dashboard → Your Project → ⚙️ Settings → Platforms → + Add Platform
```

**Form Fields:**
```
┌─────────────────────────────────────┐
│ Select a platform:                  │
│  ◉ Web App                          │
│  ○ Flutter                          │
│  ○ Apple                            │
│  ○ Android                          │
│                                      │
│ Name:                                │
│ [Local Development          ]       │
│                                      │
│ Hostname:                            │
│ [localhost                  ]       │
│                                      │
│         [Cancel]  [Next]            │
└─────────────────────────────────────┘
```

## Alternative: Temporarily Disable Platform Check (NOT RECOMMENDED)

**DO NOT DO THIS IN PRODUCTION**

If you need to test immediately while waiting for platform propagation, you can use server-side only authentication, but this will NOT enable realtime features.

## Expected Behavior After Fix

Once platform is correctly configured:

```javascript
// This should work:
await account.createEmailPasswordSession(email, password);
// ✅ Returns session object

await account.get();
// ✅ Returns user object (not guest)
```

## Summary

The error "User (role: guests)" means:
1. Appwrite doesn't recognize your domain
2. You haven't added it as a platform
3. Or you added it incorrectly

**Fix**: Add `localhost` as a Web App platform in Appwrite Console (Settings → Platforms)

**Format**: Just `localhost` - nothing else

Then refresh and try again!

