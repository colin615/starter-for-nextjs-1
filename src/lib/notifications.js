/**
 * Utility functions for managing notifications
 */

import { databases } from "./appwrite";
import { ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

/**
 * Create a new notification for a user
 * @param {string} userId - The user ID to send the notification to
 * @param {object} notificationData - The notification data
 * @param {string} notificationData.title - The notification title
 * @param {string} notificationData.message - The notification message (optional)
 * @param {string} notificationData.type - The notification type (success, error, warning, info)
 * @returns {Promise<object>} The created notification document
 */
export async function createNotification(userId, notificationData) {
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
    );

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<object>} The updated notification document
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const notification = await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId,
      {
        isRead: true,
      },
    );

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Delete a notification
 * @param {string} notificationId - The notification ID
 * @returns {Promise<void>}
 */
export async function deleteNotification(notificationId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId,
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

/**
 * Get all notifications for a user
 * @param {string} userId - The user ID
 * @param {number} limit - Number of notifications to fetch (default: 50)
 * @returns {Promise<array>} Array of notification documents
 */
export async function getUserNotifications(userId, limit = 50) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
    );

    // Filter for user's notifications (you can create an index and use Query.equal for better performance)
    const userNotifications = response.documents
      .filter((doc) => doc.userId === userId)
      .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
      .slice(0, limit);

    return userNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

