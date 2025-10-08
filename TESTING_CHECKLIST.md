# Testing Checklist for Realtime Notifications Fix

## Pre-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] Appwrite Console: Platform with your domain is added
- [ ] Appwrite Console: Notifications collection has proper permissions
- [ ] Code changes committed to version control

## Local Testing (Development)

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser Console (F12)

### 3. Test Login Flow
1. Navigate to `/login`
2. Log in with valid credentials
3. **Expected Console Logs**:
   ```
   ✅ Client SDK authenticated for user: [userId]
   🔔 NotificationCenter rendering
   🚀 Subscribing to realtime notifications for user: [userId]
   ✅ Realtime subscription active
   ✅ Loaded [N] notifications
   ```

### 4. Test Realtime Updates
1. Navigate to `/dashboard`
2. Trigger a test notification (use TestNotificationButton if available)
3. **Expected Console Logs**:
   ```
   📬 Realtime event received: [event object]
   ✨ New notification created: [notification object]
   ```
4. **Expected UI**: Notification appears immediately in the notification center
5. **Expected UI**: Badge updates with unread count

### 5. Test Notification Actions
- [ ] Click bell icon → Sheet opens with notifications
- [ ] Click "Mark as read" → Notification marked as read
- [ ] Click "Mark all read" → All notifications marked as read
- [ ] Click delete (X) → Notification removed
- [ ] Close and reopen → State persists

## Production Testing

### 1. Pre-Deployment Verification

#### Appwrite Console Setup
1. Go to Appwrite Console → Your Project → Settings → Platforms
2. Verify platform is added:
   - **Type**: Web App
   - **Name**: Your app name
   - **Hostname**: `yourdomain.com` (or `subdomain.yourdomain.com`)
   - **No** trailing slash
   - **No** http:// or https:// prefix in hostname field

#### Environment Variables in Production
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=your-collection-id
NEXT_APPWRITE_KEY=your-server-api-key
```

### 2. Deploy to Production
```bash
npm run build
# Deploy using your hosting platform (Vercel, Netlify, etc.)
```

### 3. Test Production Flow

#### A. Fresh Session Test
1. Open production URL in **incognito/private window**
2. Open browser console (F12)
3. Log in with valid credentials
4. **Check Console Logs**:
   ```
   ✅ Client SDK authenticated for user: [userId]
   🚀 Subscribing to realtime notifications for user: [userId]
   ✅ Realtime subscription active
   ```
5. **If you see errors**, check the "Troubleshooting" section below

#### B. Realtime Functionality Test
1. Trigger a test notification
2. **Expected**: Notification appears immediately
3. **Check Console**: Should see `📬 Realtime event received:`
4. **Check Network Tab**: 
   - Look for WebSocket connection (wss://)
   - Status should be 101 (Switching Protocols)
   - Should remain "pending" (open connection)

#### C. Cross-Tab Test
1. Open production site in two browser tabs
2. Trigger notification in one tab
3. **Expected**: Notification appears in BOTH tabs simultaneously
4. This confirms WebSocket is working correctly

## Troubleshooting

### Issue: "No active session" Error

**Console Log**: `❌ No active session, client not authenticated`

**Causes**:
- Session cookie not being set
- Cookie sameSite/secure settings incorrect
- Cookie domain mismatch

**Fix**:
1. Check `/src/app/api/auth/login/route.js`
2. Verify cookie settings:
   ```javascript
   cookieStore.set("appwrite-session", session.secret, {
     httpOnly: true,
     secure: process.env.NODE_ENV === "production",
     sameSite: "lax",
     maxAge: 60 * 60 * 24 * 21,
     path: "/",
   });
   ```
3. Check browser cookies (F12 → Application → Cookies)
4. Ensure `appwrite-session` cookie exists

### Issue: WebSocket Connection Failed

**Console Error**: `WebSocket connection to 'wss://...' failed`

**Causes**:
- Platform not properly configured in Appwrite
- Client SDK not authenticated
- CORS issues

**Fix**:
1. **Verify Platform in Appwrite Console**:
   - Settings → Platforms → Web App
   - Hostname must match exactly
   - No http://, https://, or trailing slash

2. **Check Authentication**:
   - Ensure you see: `✅ Client SDK authenticated`
   - If not, review AuthContext.js changes

3. **Network Tab Analysis**:
   - Open DevTools → Network tab
   - Filter by "WS" (WebSocket)
   - Check request headers for authentication
   - Look for error responses

### Issue: Realtime Works Locally But Not in Production

**Symptom**: Everything works on localhost but fails in production

**Common Causes**:
1. **Platform hostname mismatch**
   - Verify exact domain in Appwrite Console
   - Check for www vs non-www
   - Check for subdomain accuracy

2. **Environment variables not set in production**
   - Verify all NEXT_PUBLIC_* variables are set
   - Redeploy after adding variables

3. **Cookie issues in production**
   - Check secure flag is set correctly
   - Verify sameSite attribute
   - Check if domain/subdomain matters

4. **Network restrictions**
   - Some corporate networks block WebSockets
   - Try from different network
   - Check if proxy/firewall is interfering

### Issue: Notifications Don't Update in Real-time

**Symptom**: WebSocket connected but no realtime updates

**Causes**:
- Subscription channel mismatch
- User ID mismatch
- Database permissions

**Fix**:
1. **Verify Subscription Channel**:
   ```javascript
   // Should be:
   `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`
   ```

2. **Check Console for Events**:
   - Should see: `📬 Realtime event received:`
   - If not, no events are being received

3. **Database Permissions**:
   - Go to Appwrite Console → Databases → Your Collection
   - Check Read permissions include the user
   - For testing, can set to "All users" temporarily

4. **User ID Match**:
   - Console should show: `Check if the notification is for this user`
   - Verify `response.payload.userId === userId`

## Success Criteria

✅ **Local Development**
- [ ] Client authenticates on mount
- [ ] Realtime subscription establishes
- [ ] Notifications appear immediately
- [ ] No console errors

✅ **Production**
- [ ] Client authenticates on production domain
- [ ] WebSocket connection successful (101 status)
- [ ] Notifications appear in real-time
- [ ] Works across multiple tabs
- [ ] No CORS errors
- [ ] No authentication errors

## Additional Testing Scenarios

### Logout/Login Cycle
1. Log out
2. **Expected**: `❌ No active session, client not authenticated`
3. Log back in
4. **Expected**: Full authentication flow works again

### Session Expiry
1. Wait for session to expire (or manually delete cookie)
2. Reload page
3. **Expected**: Redirect to login
4. Log in again
5. **Expected**: Everything works

### Network Disconnection
1. While logged in, disconnect network
2. **Expected**: WebSocket connection lost
3. Reconnect network
4. **Expected**: WebSocket reconnects automatically (Appwrite SDK handles this)

## Performance Considerations

- [ ] WebSocket connection establishes within 1-2 seconds of authentication
- [ ] Notification UI updates within 100ms of receiving event
- [ ] No memory leaks (connection properly cleaned up on unmount)
- [ ] Multiple tabs don't cause duplicate notifications

## Security Verification

- [ ] Session cookie is httpOnly
- [ ] Session cookie is secure in production
- [ ] WebSocket connection requires authentication
- [ ] Users only receive notifications meant for them
- [ ] No sensitive data exposed in console logs (in production, consider removing debug logs)

## Final Verification

Before marking as complete:
- [ ] Tested in development ✅
- [ ] Tested in production ✅
- [ ] Tested across different browsers
- [ ] Tested on mobile devices
- [ ] No console errors in production
- [ ] Real-time updates working consistently
- [ ] Documentation updated

