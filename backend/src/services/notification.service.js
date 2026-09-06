import {
  createNotificationRecord,
  createUserNotificationRecords,
  findUserNotifications,
  countUnreadUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
} from "../repositories/notification.repository.js";
import { findUsersByRole } from "../repositories/user.repository.js";

export async function getUserNotifications(userId) {
  return await findUserNotifications(userId);
}

export async function getUnreadCount(userId) {
  return await countUnreadUserNotifications(userId);
}

export async function markNotificationRead(userId, userNotificationId) {
  return await markUserNotificationAsRead(userId, userNotificationId);
}

export async function markAllNotificationsRead(userId) {
  return await markAllUserNotificationsAsRead(userId);
}

export async function createAndDistributeNotification({
  title,
  message,
  type,
  link_url = null,
  targetUserIds = [],
  targetRoles = [],
  excludeUserId = null,
  metadata = {},
}) {
  let recipients = new Set(targetUserIds || []);

  // Fetch recipients by roles if targetRoles supplied
  if (targetRoles && targetRoles.length > 0) {
    for (const role of targetRoles) {
      try {
        const users = await findUsersByRole(role);
        if (Array.isArray(users)) {
          users.forEach((u) => recipients.add(u.id));
        }
      } catch (err) {
        console.warn(`Could not fetch users for role ${role}:`, err.message);
      }
    }
  }

  // Remove excludeUserId if specified
  if (excludeUserId) {
    recipients.delete(excludeUserId);
  }

  const finalRecipientIds = Array.from(recipients);
  if (finalRecipientIds.length === 0) {
    return null;
  }

  // Save to database / repository
  const notificationRecord = await createNotificationRecord({
    title,
    message,
    type,
    link_url,
    metadata,
  });

  const userNotifRecords = await createUserNotificationRecords(
    finalRecipientIds,
    notificationRecord.id
  );

  // Broadcast WebSocket notification to real-time connected users
  const io = globalThis.serviceRequestSocketServer;
  if (io) {
    userNotifRecords.forEach((un) => {
      const payload = {
        id: un.id,
        notification_id: notificationRecord.id,
        user_id: un.user_id,
        is_read: false,
        created_at: un.created_at || new Date().toISOString(),
        title: notificationRecord.title,
        message: notificationRecord.message,
        type: notificationRecord.type,
        link_url: notificationRecord.link_url,
        metadata: notificationRecord.metadata,
      };

      // Emit to specific user room and role rooms
      io.to(`user:${un.user_id}`).emit("notification:new", payload);
    });

    // Also broadcast to role rooms as backup
    io.to("operators").to("supervisors").emit("notification:broadcast", {
      notification: notificationRecord,
      recipientIds: finalRecipientIds,
    });
  }

  return { notification: notificationRecord, userNotifications: userNotifRecords };
}
