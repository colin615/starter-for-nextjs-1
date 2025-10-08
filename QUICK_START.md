# Notifications System - Quick Start 🚀

## ✅ What You Need to Do

### 1. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Your existing Appwrite variables remain the same
# Just add these two new ones:

NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
```

### 2. Create Appwrite Database Collection

**Go to Appwrite Console → Databases → Create Collection**

- **Collection Name**: notifications
- **Collection ID**: `notifications` (or custom, but update env var)

**Add these attributes:**

1. `userId` - String (255) - Required
2. `title` - String (255) - Required
3. `message` - String (1000) - Optional
4. `type` - String (50) - Required - Default: "info"
5. `isRead` - Boolean - Required - Default: false

**Create Index:**
- Key: `userId_index`
- Type: key
- Attribute: `userId`

**Set Permissions:**
- Create: `users`
- Read: `users`
- Update: `users`
- Delete: `users`

### 3. Test It!

1. Start your dev server: `npm run dev`
2. Go to your dashboard
3. Click the "Send Test Notification" button at the top
4. Watch the bell icon update with a badge
5. Click the bell icon to see your notification

### 4. Remove Test Button (Production)

When you're ready for production, remove the test button:

```javascript
// In src/components/DashboardClient.jsx
// Remove this import:
import { TestNotificationButton } from "./TestNotificationButton";

// Remove this JSX:
<div className="flex justify-end">
  <TestNotificationButton />
</div>
```

## 🎯 How to Send Notifications

### From Your Service Linking

Update `/src/app/api/services/link/route.js`:

```javascript
import { createAdminClient } from "@/lib/server/appwrite";
import { ID } from "node-appwrite";

export async function POST(request) {
  // ... your existing code ...
  
  // After successful link:
  const { databases } = await createAdminClient();
  await databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
    ID.unique(),
    {
      userId: user.$id,
      title: 'Service Linked! 🎉',
      message: 'Your service has been successfully connected.',
      type: 'success',
      isRead: false
    }
  );
  
  return NextResponse.json({ success: true });
}
```

### From Appwrite Function

```javascript
// In your Appwrite Function
import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
    
  const databases = new Databases(client);
  const { userId } = JSON.parse(req.body);
  
  // ... your processing logic ...
  
  // Send notification when done:
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
    ID.unique(),
    {
      userId: userId,
      title: 'Processing Complete!',
      message: 'Your task has finished successfully.',
      type: 'success',
      isRead: false
    }
  );
  
  return res.json({ success: true });
};
```

## 🔥 How Real-time Works

**No websockets needed!** Appwrite handles it automatically:

1. User opens dashboard → Subscribes to notifications collection
2. Your function/API creates a notification
3. Appwrite broadcasts the change
4. User's UI updates instantly ✨

That's it! The `NotificationCenter` component handles all the real-time subscription logic.

## 📚 More Details

- **Full Setup Guide**: See `NOTIFICATIONS_SETUP.md`
- **Integration Examples**: See `INTEGRATION_EXAMPLE.md`

## 🐛 Troubleshooting

**Notifications not appearing?**
- Check environment variables are set correctly
- Verify collection permissions in Appwrite console
- Check browser console for errors

**Bell icon not showing?**
- The notification bell is in the dashboard layout header
- Make sure you're on a dashboard page

**Test button not working?**
- Check the API route `/api/notifications/test` is accessible
- Verify you're logged in
- Check browser console for errors

## 🎨 Notification Types

| Type | Use Case |
|------|----------|
| `success` | Service linked, action completed |
| `error` | Service failed, error occurred |
| `warning` | Attention needed, limits approaching |
| `info` | General updates, status changes |

