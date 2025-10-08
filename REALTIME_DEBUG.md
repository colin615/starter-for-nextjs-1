# 🔍 Appwrite Realtime Debugging Guide

## Issue: Realtime Events Not Being Received

Subscription is working, but no events are coming through. Let's debug!

## ✅ Step 1: Check Appwrite Console Settings

### A. Enable Realtime in Your Project

1. **Go to Appwrite Console**: https://cloud.appwrite.io
2. **Select your project**
3. **Go to Settings** (gear icon in sidebar)
4. **Check "Realtime" section**
   - Make sure Realtime is **ENABLED** ✅
   - Check if there are any domain restrictions

### B. Verify Collection Settings

1. Go to **Databases** → `skapex-dash-db`
2. Click on **notifications** collection
3. Go to **Settings** tab
4. Check:
   - Collection is **ENABLED** ✅
   - **Realtime** is enabled for this collection ✅

## 🧪 Step 2: Test Realtime Connection Directly

Open your browser console and run this test:

```javascript
// Import the client
const { client } = await import('/src/lib/appwrite.js');

// Test subscription
const unsubscribe = client.subscribe(
  ['databases.skapex-dash-db.collections.notifications.documents'],
  (response) => {
    console.log('🎉 REALTIME EVENT RECEIVED:', response);
  }
);

console.log('✅ Subscribed! Now create a notification...');
```

Then click "Send Test Notification" button. You should see the event!

## 🔧 Step 3: Check WebSocket Connection

In your browser DevTools:

1. Go to **Network** tab
2. Filter by **WS** (WebSocket)
3. You should see a connection to Appwrite's realtime endpoint
4. Status should be **101 Switching Protocols** (green)
5. Click on it to see messages being sent/received

### Expected WebSocket URL:
```
wss://cloud.appwrite.io/v1/realtime?project=YOUR_PROJECT_ID&channels[]=databases.skapex-dash-db.collections.notifications.documents
```

## 📋 Step 4: Common Issues & Solutions

### Issue 1: Realtime Not Enabled
**Solution:** Enable in Appwrite Console → Settings → Realtime

### Issue 2: CORS/Domain Restrictions
**Solution:** 
- Go to Appwrite Console → Settings → Platforms
- Add `localhost:3000` or your domain
- Make sure `*` wildcard is allowed for development

### Issue 3: Wrong Channel Format
**Current format:** `databases.{dbId}.collections.{collectionId}.documents`

**Try alternate formats:**
- `databases.skapex-dash-db.collections.notifications.documents.*`
- `documents`
- `databases`

### Issue 4: WebSocket Blocked by Browser/Network
**Check:**
- Browser console for WebSocket errors
- Network tab for failed WebSocket connections
- Firewall/antivirus blocking WebSocket connections

### Issue 5: Session/Authentication Issue
The Appwrite client needs to authenticate to subscribe:
- Client must have valid session
- Check if cookies are being sent with WebSocket upgrade request

## 🔍 Step 5: Enhanced Debug Script

Add this to your browser console to get detailed debug info:

```javascript
// Enhanced realtime debugging
const { client } = await import('/src/lib/appwrite.js');

console.log('=== APPWRITE REALTIME DEBUG ===');
console.log('Endpoint:', client.config.endpoint);
console.log('Project:', client.config.project);

// Override the client's realtime to see connection events
const originalSubscribe = client.subscribe.bind(client);
client.subscribe = function(channels, callback) {
  console.log('📡 Subscribing to:', channels);
  
  const wrappedCallback = (response) => {
    console.log('🎉 EVENT RECEIVED:', {
      events: response.events,
      channels: response.channels,
      timestamp: new Date().toISOString(),
      payload: response.payload
    });
    callback(response);
  };
  
  return originalSubscribe(channels, wrappedCallback);
};

console.log('✅ Debug mode enabled. Now subscribe to channels...');
```

## 🚨 If Still Not Working

### Option A: Check Appwrite Version
Appwrite Cloud should have Realtime enabled by default. If self-hosted:
- Ensure Appwrite Realtime service is running
- Check Docker Compose includes `appwrite-realtime` service
- Port 80/443 should be exposed for WebSocket upgrade

### Option B: Alternative Approach (Polling)
If Realtime is truly not available, we can implement polling:

```javascript
// Fallback: Poll for new notifications every 5 seconds
React.useEffect(() => {
  if (!userId) return;
  
  const interval = setInterval(() => {
    fetchNotifications();
  }, 5000);
  
  return () => clearInterval(interval);
}, [userId]);
```

### Option C: Check Appwrite Status
- Visit: https://status.appwrite.io
- Check if Realtime service has known issues

## 📊 Expected Console Output

When working correctly, you should see:

```
🔌 Realtime: Subscribing to notifications for user: 68d3ac588e1f1f5e55cc
📡 Realtime: Channel: databases.skapex-dash-db.collections.notifications.documents
🔍 Client endpoint: https://cloud.appwrite.io/v1
🔍 Client project: YOUR_PROJECT_ID
✅ Realtime: Subscribed successfully
⏳ Realtime: Waiting for events...

[User clicks "Send Test Notification"]

📨 Realtime event received: ["databases.skapex-dash-db.collections.notifications.documents.68e5cc55001c734c1ee6.create"]
📦 Payload: {userId: "...", title: "Test Notification", ...}
✅ Notification is for current user
🔍 Event string: databases.skapex-dash-db.collections.notifications.documents.68e5cc55001c734c1ee6.create
🆕 New notification created: {...}
```

## 🎯 Next Steps

1. **Check WebSocket tab** in Network DevTools
2. **Run the debug script** above
3. **Share the console output** when you click "Send Test Notification"
4. **Check Appwrite Console** → Settings → Realtime is enabled

Let me know what you find! 🔍

