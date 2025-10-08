# Notifications System Setup Guide

This guide will help you set up the real-time notifications system using Appwrite.

## 🚀 Features

- ✅ Real-time notifications using Appwrite Realtime (no websockets needed!)
- 🔔 Bell icon with unread count badge
- 📱 Responsive drawer/sheet UI
- ✨ Mark as read/unread functionality
- 🗑️ Delete notifications
- 🎨 Beautiful shadcn/ui design

## 📋 Setup Steps

### 1. Create Appwrite Database Collection

1. **Go to your Appwrite Console** → Databases
2. **Create or select a database** (note the Database ID)
3. **Create a new collection** called "notifications"
   - Collection ID: `notifications` (or your choice)
   - Permissions: Configure based on your needs

### 2. Add Collection Attributes

Create the following attributes in your notifications collection:

| Attribute Name | Type    | Size | Required | Array | Default |
|----------------|---------|------|----------|-------|---------|
| `userId`       | String  | 255  | Yes      | No    | -       |
| `title`        | String  | 255  | Yes      | No    | -       |
| `message`      | String  | 1000 | No       | No    | -       |
| `type`         | String  | 50   | Yes      | No    | "info"  |
| `isRead`       | Boolean | -    | Yes      | No    | false   |

### 3. Create Index for Better Performance

Create an index on the `userId` attribute:
- Index Key: `userId_index`
- Type: `key`
- Attributes: `userId`

### 4. Set Collection Permissions

You have two options:

#### Option A: Document-level permissions (Recommended)
1. Enable "Document Security" in collection settings
2. Set collection permissions:
   - Create: `users` (any authenticated user can create)
   - Read: `users`
3. When creating documents, set permissions:
   ```javascript
   Permission.read(Role.user(userId)),
   Permission.update(Role.user(userId)),
   Permission.delete(Role.user(userId))
   ```

#### Option B: Collection-level permissions (Simpler)
Set these permissions on the collection:
- Create: `users`
- Read: `users`
- Update: `users`
- Delete: `users`

### 5. Add Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
```

### 6. Update Appwrite Client (Add Realtime Support)

The client setup is already in place, but ensure you have the latest Appwrite SDK:

```bash
npm install appwrite@latest
```

## 🎯 Usage

### Sending Notifications from Your Code

#### Client-side (from your Next.js app):

```javascript
import { createNotification } from '@/lib/notifications';

// Example: After a user action
await createNotification(userId, {
  title: 'Success!',
  message: 'Your action was completed successfully.',
  type: 'success' // success, error, warning, info
});
```

#### Server-side (API Route):

```javascript
// In your API route (e.g., /api/services/link/route.js)
import { createAdminClient } from '@/lib/server/appwrite';
import { createNotification } from '@/lib/server/notifications';

export async function POST(request) {
  const { userId } = await request.json();
  const { databases } = await createAdminClient();
  
  // ... your linking logic ...
  
  // Send notification when complete
  await createNotification(databases, userId, {
    title: 'Service Linking Complete',
    message: 'Your service has been successfully linked!',
    type: 'success'
  });
  
  return Response.json({ success: true });
}
```

#### From Appwrite Function (when function finishes):

```javascript
// In your Appwrite Function
import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
    
  const databases = new Databases(client);
  const userId = req.body.userId; // Get from function payload
  
  try {
    // ... your service linking logic ...
    
    // Send notification when complete
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: userId,
        title: 'Linking Complete! 🎉',
        message: 'Your service has been successfully linked and is now active.',
        type: 'success',
        isRead: false
      }
    );
    
    return res.json({ success: true });
  } catch (err) {
    // Send error notification
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: userId,
        title: 'Linking Failed',
        message: 'There was an error linking your service. Please try again.',
        type: 'error',
        isRead: false
      }
    );
    
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

## 🔥 How Realtime Works

Appwrite's Realtime feature automatically pushes updates to connected clients. Here's what happens:

1. **Client subscribes** to the notifications collection when the NotificationCenter component mounts
2. **Function creates notification** in Appwrite database
3. **Appwrite automatically broadcasts** the change to all subscribed clients
4. **Your UI updates instantly** without polling or manual refreshes

The subscription in `NotificationCenter.jsx` looks like this:

```javascript
client.subscribe(
  [`databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`],
  (response) => {
    // Automatically receives new notifications, updates, and deletes
  }
);
```

## 🎨 Notification Types

Available notification types with their icons:

- `success` - ✅ Green success message
- `error` - ❌ Red error message
- `warning` - ⚠️ Yellow warning message
- `info` - ℹ️ Blue informational message

## 📱 UI Components Used

- `Sheet` - Slide-in drawer from shadcn/ui
- `Badge` - Unread count indicator
- `ScrollArea` - Scrollable notification list
- `Button` - Action buttons

## 🔧 Customization

### Change notification duration display:
Edit the `formatTimestamp` function in `NotificationCenter.jsx`

### Customize notification icons:
Edit the `getNotificationIcon` function in `NotificationCenter.jsx`

### Add notification sounds:
Add an audio element and play it when new notifications arrive in the realtime subscription callback

### Add click actions:
Add a `link` or `action` field to your notification schema and handle clicks in the UI

## 🐛 Troubleshooting

**Notifications not appearing in realtime?**
- Check that your environment variables are set correctly
- Verify Appwrite Realtime is enabled in your project settings
- Check browser console for subscription errors

**Permission denied errors?**
- Verify collection permissions are set correctly
- Ensure user is authenticated
- Check document-level permissions if enabled

**Old notifications not loading?**
- Verify the Database ID and Collection ID in your environment variables
- Check the console for API errors
- Ensure the user has read permissions

## 📚 Resources

- [Appwrite Realtime Documentation](https://appwrite.io/docs/realtime)
- [Appwrite Databases Documentation](https://appwrite.io/docs/databases)
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/sheet)

