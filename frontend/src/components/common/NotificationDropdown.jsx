import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCheck,
  MessageSquare,
  ClipboardList,
  RefreshCw,
  Wrench,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { notificationApi } from "../../services/notification.api";
import { getServiceRequestSocket } from "../../sockets/serviceRequest.socket";
import { useAuth } from "../../context/AuthContext";

const typeIcons = {
  CHAT: MessageSquare,
  OVERDUE: ShieldAlert,
};

const typeColors = {
  CHAT: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-amber-100 text-amber-700",
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ]);

      let notifList = Array.isArray(listRes) ? listRes : [];
      let count = countRes?.unreadCount !== undefined ? countRes.unreadCount : 0;

      if (window.location.pathname.endsWith("/chat")) {
        const unreadChatNotifs = notifList.filter(
          (n) => n.type === "CHAT" && !n.is_read
        );
        if (unreadChatNotifs.length > 0) {
          console.log("💬 [Auto-marking Loaded Unread Chat Notifications as Read]", {
            count: unreadChatNotifs.length,
            unreadChatNotifications: unreadChatNotifs,
          });
          unreadChatNotifs.forEach((n) => {
            if (n.notification_id) {
              notificationApi.markAsRead(n.notification_id).catch(() => {});
            }
          });
          notifList = notifList.map((n) =>
            n.type === "CHAT" ? { ...n, is_read: true } : n
          );
          count = Math.max(0, count - unreadChatNotifs.length);
        }
        setHasUnreadChat(false);
      }

      const unreadList = notifList.filter((n) => !n.is_read);
      console.log("🔔 [Notifications Loaded]", {
        totalNotifications: notifList.length,
        unreadCount: count,
        unreadItems: unreadList,
        path: window.location.pathname,
      });

      setNotifications(notifList);
      setUnreadCount(count);
    } catch (err) {
      console.warn("Failed to load notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const socket = getServiceRequestSocket();
    if (socket && user?.id) {
      socket.emit("joinUser", user.id);
      socket.emit("joinRole", user.role);

      const handleNewNotification = (newNotif) => {
        const isChatRoute = window.location.pathname.endsWith("/chat");
        const isChatNotif = newNotif.type === "CHAT";

        console.log("🔔 [New Notification Received via Socket]", {
          notification: newNotif,
          isChatRoute,
          isChatNotif,
        });

        setNotifications((prev) => {
          if (
            prev.some(
              (n) => n.notification_id === newNotif.notification_id,
            )
          )
            return prev;
          return [
            isChatRoute && isChatNotif
              ? { ...newNotif, is_read: true }
              : newNotif,
            ...prev,
          ];
        });

        if (isChatRoute && isChatNotif) {
          if (newNotif.notification_id) {
            notificationApi.markAsRead(newNotif.notification_id).catch(() => {});
          }
        } else {
          setUnreadCount((prev) => prev + 1);
        }
      };

      const handleChatUnreadSignal = (data) => {
        const senderId = data?.senderId || data?.sender_id;
        console.log("💬 [Chat Unread Signal Received]", { data, senderId });
        if (
          senderId &&
          senderId !== user.id &&
          !window.location.pathname.endsWith("/chat")
        ) {
          setHasUnreadChat(true);
        }
      };

      socket.on("notification:new", handleNewNotification);
      socket.on("chat:unread", handleChatUnreadSignal);
      socket.on("chat:message", handleChatUnreadSignal);

      return () => {
        socket.off("notification:new", handleNewNotification);
        socket.off("chat:unread", handleChatUnreadSignal);
        socket.off("chat:message", handleChatUnreadSignal);
      };
    }
  }, [user]);

  // Click outside to close dropdown on desktop
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-mark CHAT notifications as read when user is on or navigates to the Group Chat page
  useEffect(() => {
    if (location.pathname.endsWith("/chat")) {
      setHasUnreadChat(false);

      setNotifications((prev) => {
        const unreadChatNotifs = prev.filter(
          (n) => n.type === "CHAT" && !n.is_read
        );

        if (unreadChatNotifs.length > 0) {
          console.log("💬 [Auto-marking Active Unread Chat Notifications as Read]", {
            count: unreadChatNotifs.length,
            unreadChatNotifications: unreadChatNotifs,
          });

          unreadChatNotifs.forEach((n) => {
            if (n.notification_id) {
              notificationApi.markAsRead(n.notification_id).catch(() => {});
            }
          });

          setUnreadCount((count) =>
            Math.max(0, count - unreadChatNotifs.length)
          );

          return prev.map((n) =>
            n.type === "CHAT" ? { ...n, is_read: true } : n
          );
        }
        return prev;
      });
    }
  }, [location.pathname]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationApi.markAsRead(id);
    } catch (err) {
      console.warn("Failed to mark notification read:", err.message);
    }
  };

  async function handleMarkAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark all read:", err.message);
    }
  }

  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      await handleMarkAsRead(item.notification_id);
    }
    setIsOpen(false);
  };

  const totalUnreadCount = unreadCount + (hasUnreadChat ? 1 : 0);

  const handleOpenChat = () => {
    setHasUnreadChat(false);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
        aria-label="Notifications"
        type="button"
      >
        <Bell size={19} />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-md animate-pulse">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay for mobile screens */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-2xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-11 sm:w-96 rounded-2xl border border-tech-line bg-white p-4 shadow-2xl animate-in fade-in duration-150 max-h-[80vh] sm:max-h-[520px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <span>Notifications</span>
                {totalUnreadCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-700">
                    {totalUnreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-tech-blue hover:underline cursor-pointer"
                    type="button"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  type="button"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 my-1 pr-0.5">
              {/* Unread Chat Banner Item */}
              {hasUnreadChat && (
                <Link
                  to={
                    user?.role === "SUPERVISOR"
                      ? "/supervisor/chat"
                      : "/operator/chat"
                  }
                  onClick={handleOpenChat}
                  className="flex items-start gap-3 p-3 transition rounded-xl my-1 bg-sky-50/90 hover:bg-sky-100/80 border border-sky-100 font-medium"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <MessageSquare size={15} />
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-900">
                        Unread Group Chat
                      </span>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-600 animate-pulse" />
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      You have new unread messages in staff chat.
                    </p>
                    <div className="mt-1 text-[10px] font-bold text-tech-blue">
                      Open Group Chat →
                    </div>
                  </div>
                </Link>
              )}

              {loading &&
              notifications.length === 0 &&
              !hasUnreadChat ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 && !hasUnreadChat ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Bell
                    size={28}
                    className="mx-auto mb-2 text-slate-300"
                  />
                  <p className="font-semibold text-slate-600">
                    No notifications yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const IconComponent = typeIcons[item.type] || Bell;
                  const badgeColor =
                    typeColors[item.type] ||
                    "bg-slate-100 text-slate-700";
                  const isUnread = !item.is_read;
                  return (
                    <div
                      key={item.notification_id || item.id}
                      className={`flex items-start gap-3 p-3 transition rounded-xl my-1 ${
                        isUnread
                          ? "bg-sky-50/60 font-medium"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor}`}
                      >
                        <IconComponent size={15} />
                      </div>

                      <div className="flex-1 text-xs min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-slate-900 truncate">
                            {item.title ||
                              (item.type === "CHAT"
                                ? "New Chat Message"
                                : item.type === "OVERDUE"
                                  ? "Service Request Overdue"
                                  : "Notification")}
                          </span>
                          {isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-tech-blue" />
                          )}
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px] break-words">
                          {item.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400 border-t border-slate-100/50">
                          <span>
                            {new Date(item.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <Link
                              to={
                                item.type === "CHAT"
                                  ? `/${user?.role?.toLowerCase()}/chat`
                                  : user?.role === "SUPERVISOR"
                                    ? `/supervisor/service-requests`
                                    : `/${user?.role?.toLowerCase()}/requests/${item.service_request_id || ""}`
                              }
                              onClick={() =>
                                handleNotificationClick(item)
                              }
                              className="font-bold text-tech-blue hover:underline"
                            >
                              View
                            </Link>
                            {isUnread && (
                              <button
                                onClick={(e) =>
                                  handleMarkAsRead(
                                    item.notification_id,
                                    e,
                                  )
                                }
                                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                                type="button"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
