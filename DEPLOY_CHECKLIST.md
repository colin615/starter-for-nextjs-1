# Production Deployment Checklist

## Before Deploying

### 1. Appwrite Platform Configuration
- [ ] Log in to Appwrite Console
- [ ] Navigate to: **Settings** → **Platforms** → **Web App**
- [ ] Add production hostname: `your-subdomain.yourdomain.com`
- [ ] Verify localhost:3000 is also listed (for local dev)

### 2. Environment Variables
Ensure these are set in your production environment:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://[your-appwrite-endpoint]
NEXT_PUBLIC_APPWRITE_PROJECT_ID=[your-project-id]
NEXT_PUBLIC_APPWRITE_DATABASE_ID=[your-database-id]
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=[your-collection-id]
```

⚠️ **Important**: All variables starting with `NEXT_PUBLIC_` are exposed to the browser. This is correct and necessary for client-side Appwrite SDK.

### 3. Build & Deploy
```bash
npm run build
npm run start
```

## After Deploying

### 1. Test Authentication Flow
- [ ] Open your production URL
- [ ] Try to sign up a new account
- [ ] Verify redirect to dashboard
- [ ] Log out
- [ ] Log back in
- [ ] Verify redirect to dashboard

### 2. Test Notifications
- [ ] Click the bell icon (should show empty state or existing notifications)
- [ ] Click "Send Test Notification" button
- [ ] Verify notification appears immediately (real-time)
- [ ] Mark notification as read
- [ ] Delete notification
- [ ] Verify all actions work

### 3. Check Browser Console
Open DevTools → Console:
- [ ] No error 1003 messages
- [ ] No authentication errors
- [ ] Should see: `✅ Loaded X notifications`

### 4. Check WebSocket Connection
Open DevTools → Network → WS tab:
- [ ] WebSocket connection established
- [ ] Status code: 101 (Switching Protocols)
- [ ] Connection stays open
- [ ] Messages flowing when notification created

## Troubleshooting Production Issues

### Issue: Error 1003 in WebSocket
**Solution:**
1. Check Appwrite platform settings - is your domain added?
2. Verify domain spelling matches exactly (no typos)
3. Don't include `https://` in platform hostname

### Issue: Notifications Don't Load
**Check:**
1. Browser console for errors
2. Network tab → XHR requests to Appwrite
3. Authentication working (can you see user data?)
4. Collection permissions allow user to read their own documents

### Issue: Real-time Updates Not Working
**Check:**
1. WebSocket connection in Network → WS tab
2. Browser console for subscription errors
3. Document permissions include read access for user
4. Notification userId matches current user ID

### Issue: Login/Signup Fails
**Check:**
1. Environment variables are set correctly
2. Appwrite endpoint is accessible from production
3. Platform settings include your domain
4. Browser console for Appwrite SDK errors

## Quick Verification Script

Run this in browser console on your production site:

```javascript
// Check if Appwrite client is configured
console.log("Appwrite Endpoint:", window.location.origin);

// Check environment variables (they're public, so this is safe)
console.log({
  ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  PROJECT: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
});

// Test if you can fetch current session
const { Client, Account } = Appwrite;
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
const account = new Account(client);

account.get().then(user => {
  console.log("✅ Authenticated as:", user.email);
}).catch(err => {
  console.error("❌ Not authenticated:", err);
});
```

## Performance Monitoring

### What to Monitor
1. **WebSocket connection stability** - should stay open
2. **Notification load time** - should be < 1 second
3. **Real-time latency** - notifications should appear within 1-2 seconds
4. **Authentication speed** - login should be instant

### Expected Console Output (Normal Operation)
```
🔔 NotificationCenter rendering {userId: "abc123", unreadCount: 0}
✅ Loaded 5 notifications
Test notification sent: {$id: "xyz789", ...}
```

## Security Verification

### Verify HTTPS
- [ ] Production URL uses HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

### Verify Appwrite Security
- [ ] API key not exposed in client code
- [ ] Document permissions correctly set
- [ ] Users can only see their own notifications
- [ ] Users can only modify their own notifications

## Common Gotchas

1. **Forgetting to add production domain to Appwrite platform settings** ← #1 issue!
2. Environment variables not set in production
3. Typo in domain name (e.g., `app.site.com` vs `app.mysite.com`)
4. Including `https://` in platform hostname (should be just domain)
5. Cookie issues due to ad blockers or privacy extensions

## Success Criteria

✅ Login works  
✅ Signup works  
✅ Notifications load  
✅ Real-time notifications appear instantly  
✅ WebSocket connected (no error 1003)  
✅ No console errors  
✅ Users can't see other users' notifications  

---

**Need Help?** Check `CROSS_DOMAIN_AUTH_FIX.md` for detailed technical explanation.

