import { apiRequest } from "./api";

export const notificationApi = {
  getNotifications: () => apiRequest("/notifications"),
  getUnreadCount: () => apiRequest("/notifications/unread-count"),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () => apiRequest("/notifications/read-all", { method: "POST" }),
};
