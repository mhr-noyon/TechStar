import {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service.js";

export async function fetchUserNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await getUserNotifications(userId);
    console.log("fetchUserNotifications notifications:", notifications, "userId:", userId);
    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function fetchUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);
    console.log("fetchUnreadCount count:", count);
    return res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
}

export async function markSingleAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    // Route uses ':id', so map it to notificationId
    const { id } = req.params;
    const notificationId = id;
    const result = await markNotificationRead(userId, notificationId);
    const unreadCount = await getUnreadCount(userId);
    return res.json({
      success: true,
      data: result,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    await markAllNotificationsRead(userId);
    return res.json({
      success: true,
      data: { message: "All notifications marked as read" },
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
}
