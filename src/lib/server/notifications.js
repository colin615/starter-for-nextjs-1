/**
 * Server-side utility functions for managing notifications
 * Use this in API routes and Appwrite Functions
 */

import { ID } from "node-appwrite";

/**
 * Create a notification for a user (server-side)
 * Use this in your Appwrite Functions when a service linking is complete
 *
 * @param {object} databases - Appwrite Databases instance
 * @param {string} userId - The user ID to send the notification to
 * @param {object} notificationData - The notification data
 * @param {string} notificationData.title - The notification title
 * @param {string} notificationData.message - The notification message (optional)
 * @param {string} notificationData.type - The notification type (success, error, warning, info)
 * @returns {Promise<object>} The created notification document
 */
export async function createNotification(databases, userId, notificationData) {
  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const NOTIFICATIONS_COLLECTION_ID =
    process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

  try {
    const notification = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        title: notificationData.title,
        message: notificationData.message || "",
        type: notificationData.type || "info",
        isRead: false,
      },
      [
        `read("user:${userId}")`,
        `update("user:${userId}")`,
        `delete("user:${userId}")`,
      ],
    );

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Example usage in an Appwrite Function:
 *
 * import { createNotification } from './notifications.js';
 *
 * export default async ({ req, res, log, error }) => {
 *   const { databases } = req;
 *   const userId = req.body.userId;
 *
 *   // ... your service linking logic ...
 *
 *   // After linking is complete:
 *   await createNotification(databases, userId, {
 *     title: 'Service Linking Complete',
 *     message: 'Your service has been successfully linked!',
 *     type: 'success'
 *   });
 *
 *   return res.json({ success: true });
 * };
 */

