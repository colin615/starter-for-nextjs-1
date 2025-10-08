# Testing the Updated Notification System

## Quick Test Checklist

### 1. Local Testing
```bash
npm run dev
```

1. ✅ Log in to your account
2. ✅ Click the bell icon in the top right
3. ✅ Click "Send Test Notification" button
4. ✅ Verify notification appears in the panel
5. ✅ Check browser console for: "✅ Loaded X notifications"
6. ✅ Test marking as read
7. ✅ Test deleting notifications
8. ✅ Wait 30 seconds and verify auto-refresh works

### 2. Production Testing
```bash
npm run build
npm run start
```

Or deploy to Vercel and test:

1. ✅ Log in to your account
2. ✅ Send a test notification
3. ✅ Verify it appears (may take up to 30 seconds)
4. ✅ Open notification panel - should refresh immediately
5. ✅ Test all CRUD operations

### 3. Debug Mode

Check browser console for these messages:

- `🔔 NotificationCenter rendering` - Component is loading
- `✅ Loaded X notifications` - Notifications fetched successfully
- Any errors will be logged with details

### 4. Network Tab

In browser DevTools → Network tab, you should see:

- `GET /api/notifications/list` - Every 30 seconds
- `PATCH /api/notifications/{id}` - When marking as read
- `DELETE /api/notifications/{id}` - When deleting
- All requests should have session cookies attached

## Expected Behavior

### Polling
- Notifications automatically refresh every 30 seconds
- When you open the notification panel, it immediately fetches latest

### Operations
- All operations are optimistic (UI updates immediately)
- If server fails, UI reverts to previous state
- All operations work both locally and in production

## Troubleshooting

### Issue: Notifications not appearing
**Check:**
1. User is logged in (session cookie exists)
2. Database and collection IDs are correct in `.env`
3. API routes are accessible (check `/api/notifications/list` directly)

### Issue: 401 Unauthorized
**Check:**
1. Session cookie is being sent (Network tab → Cookies)
2. Middleware is not blocking API routes
3. Appwrite session is still valid

### Issue: Polling not working
**Check:**
1. Browser console for errors
2. Component hasn't unmounted (interval cleanup)
3. Network tab shows requests every 30 seconds

### Issue: Notifications appear but can't interact
**Check:**
1. Notification document has correct permissions
2. User ID matches the logged-in user
3. API routes return successful responses

## Production Checklist

Before deploying to production:

- [ ] Environment variables are set in Vercel
- [ ] Database and collection exist in Appwrite
- [ ] Collection has proper indexes (userId)
- [ ] Document permissions are configured
- [ ] API routes are not blocked by middleware
- [ ] Session cookies work across domains (if applicable)

## Performance Notes

### Polling Frequency
Current: **30 seconds**

Adjust in `src/components/NotificationCenter.jsx`:
```javascript
const POLLING_INTERVAL = 30000; // Change this value
```

**Recommendations by traffic:**
- Low traffic: 10-30 seconds
- Medium traffic: 30-60 seconds  
- High traffic: 60-120 seconds

### Database Queries
- Index on `userId` for faster queries
- Limit to 50 most recent notifications
- Consider pagination for users with many notifications

## Success Indicators

You'll know it's working when:

1. ✅ Notifications appear in both localhost and production
2. ✅ Bell icon shows unread count badge
3. ✅ Auto-refresh works (new notifications appear without page reload)
4. ✅ All CRUD operations work smoothly
5. ✅ No WebSocket errors in console
6. ✅ No authentication errors in production

