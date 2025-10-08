# Notification Integration Examples

## Example 1: Send Notification After Service Link (Immediate)

Update your `/src/app/api/services/link/route.js` to send a notification immediately after linking:

```javascript
import { createSessionClient, createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

export async function POST(request) {
  try {
    const payload = await request.json();
    const { identifier } = payload;

    // ... your existing validation code ...

    const { account, tablesdb } = await createSessionClient();
    const user = await account.get();

    // ... your existing linking logic ...

    // After successful link, send notification
    const { databases } = await createAdminClient();
    
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        title: 'Service Linked Successfully! 🎉',
        message: `Your ${identifier} service has been linked and is ready to use.`,
        type: 'success',
        isRead: false
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Link service error:", error);
    
    // Send error notification
    try {
      const { account } = await createSessionClient();
      const user = await account.get();
      const { databases } = await createAdminClient();
      
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          title: 'Service Linking Failed',
          message: 'There was an error linking your service. Please try again.',
          type: 'error',
          isRead: false
        }
      );
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }
    
    return NextResponse.json(
      { error: "An error occurred while linking the service" },
      { status: 500 },
    );
  }
}
```

## Example 2: Send Notification from Appwrite Function (Delayed/Async)

If your service linking triggers a long-running Appwrite Function, send the notification when the function completes:

### Create an Appwrite Function

```javascript
// functions/process-service-link/src/main.js
import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY);
    
  const databases = new Databases(client);
  
  try {
    // Get data from request
    const { userId, identifier, authData } = JSON.parse(req.body);
    
    log(`Processing service link for user ${userId}, service ${identifier}`);
    
    // Simulate long-running process (replace with your actual logic)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Your service linking/verification logic here
    // ...
    
    // Send success notification
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: userId,
        title: 'Service Processing Complete! 🎉',
        message: `Your ${identifier} service has been successfully processed and verified.`,
        type: 'success',
        isRead: false
      }
    );
    
    log('Success notification sent');
    
    return res.json({ 
      success: true,
      message: 'Service linked and notification sent'
    });
    
  } catch (err) {
    error(`Error processing service link: ${err.message}`);
    
    // Try to send error notification
    try {
      const { userId, identifier } = JSON.parse(req.body);
      
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: userId,
          title: 'Service Processing Failed',
          message: `We encountered an error processing your ${identifier} service. Please try again or contact support.`,
          type: 'error',
          isRead: false
        }
      );
    } catch (notifError) {
      error(`Could not send error notification: ${notifError.message}`);
    }
    
    return res.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
};
```

### Trigger the Function from Your API Route

Update your `/src/app/api/services/link/route.js`:

```javascript
export async function POST(request) {
  try {
    // ... existing validation ...
    
    const { account, tablesdb } = await createSessionClient();
    const user = await account.get();
    
    // ... existing linking logic ...
    
    // Trigger the async function
    const functionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/functions/${process.env.APPWRITE_FUNCTION_ID}/executions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': process.env.NEXT_APPWRITE_KEY,
        },
        body: JSON.stringify({
          userId: user.$id,
          identifier,
          authData
        })
      }
    );
    
    // Send immediate notification that processing has started
    const { databases } = await createAdminClient();
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        title: 'Service Link Started',
        message: `We're processing your ${identifier} service. You'll receive a notification when it's complete.`,
        type: 'info',
        isRead: false
      }
    );

    return NextResponse.json({
      success: true,
      message: "Service link processing started"
    });
    
  } catch (error) {
    // ... error handling ...
  }
}
```

## Example 3: Send Notification from Client-Side Code

```javascript
// In your component (e.g., after a successful form submission)
import { createNotification } from '@/lib/notifications';

const handleLinkService = async (formData) => {
  try {
    const response = await fetch('/api/services/link', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      // Send notification
      await createNotification(user.$id, {
        title: 'Service Link Initiated',
        message: 'Your service is being processed.',
        type: 'info'
      });
    }
  } catch (error) {
    console.error(error);
  }
};
```

## Example 4: Scheduled Notification (Via Cron Function)

Create a scheduled Appwrite Function that sends daily/weekly summary notifications:

```javascript
// functions/daily-summary/src/main.js
export default async ({ req, res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
    
  const databases = new Databases(client);
  
  try {
    // Get all active users
    const { account } = await createAdminClient();
    const users = await account.list();
    
    for (const user of users.users) {
      // Send daily summary notification
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          title: 'Daily Summary 📊',
          message: 'Your daily activity summary is ready to view.',
          type: 'info',
          isRead: false
        }
      );
    }
    
    return res.json({ success: true, notificationsSent: users.users.length });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

## Testing the Notifications System

### 1. Add Test Button to Your Dashboard

Temporarily add the test button to your dashboard page:

```javascript
// src/app/dashboard/page.jsx
import { TestNotificationButton } from '@/components/TestNotificationButton';

export default function Dashboard() {
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Temporary test button - remove in production */}
      <div className="fixed bottom-4 right-4 z-50">
        <TestNotificationButton />
      </div>
    </div>
  );
}
```

### 2. Test via API Route

Use curl or your API client:

```bash
# Test notification endpoint
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json"
```

### 3. Test Realtime Updates

1. Open two browser windows side by side
2. Log in with the same user in both
3. Send a notification from one window
4. Watch it appear instantly in both windows

## Notification Types Reference

| Type | Icon | Use Case |
|------|------|----------|
| `success` | ✅ | Service linked, action completed successfully |
| `error` | ❌ | Service link failed, error occurred |
| `warning` | ⚠️ | Service needs attention, rate limit approaching |
| `info` | ℹ️ | General information, status updates |

## Best Practices

1. **Don't spam users**: Limit notifications to important events
2. **Be specific**: Include relevant details in the message
3. **Use appropriate types**: Match the notification type to the event
4. **Clean up old notifications**: Consider auto-deleting notifications older than 30 days
5. **Test realtime**: Always test that notifications appear in real-time
6. **Handle errors gracefully**: Don't let notification failures break your main flow

