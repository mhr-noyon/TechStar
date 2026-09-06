import React, { useState, useEffect } from "react";
import { Bell, X, CheckCheck, MessageSquare, ClipboardList, RefreshCw, Wrench, DollarSign, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { notificationApi } from "../../services/notification.api";
import { getServiceRequestSocket } from "../../sockets/serviceRequest.socket";
import { useAuth } from "../../context/AuthContext";

const typeIcons = {
  CHAT_MESSAGE: MessageSquare,
  NEW_SERVICE_REQUEST: ClipboardList,
  STATUS_UPDATE: RefreshCw,
  TECHNICIAN_ASSIGNMENT: Wrench,
  PAYMENT_UPDATE: DollarSign,
  SYSTEM: ShieldAlert,
};

const typeColors = {
  CHAT_MESSAGE: "bg-blue-100 text-blue-700",
  NEW_SERVICE_REQUEST: "bg-amber-100 text-amber-700",
  STATUS_UPDATE: "bg-emerald-100 text-emerald-700",
  TECHNICIAN_ASSIGNMENT: "bg-purple-100 text-purple-700",
  PAYMENT_UPDATE: "bg-green-100 text-green-700",
  SYSTEM: "bg-slate-100 text-slate-700",
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname.endsWith("/chat");

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ]);

      if (Array.isArray(listRes.data)) {
        setNotifications(listRes.data);
      }
      if (countRes?.data?.unreadCount !== undefined) {
        setUnreadCount(countRes.data.unreadCount);
      }
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
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      };

      const handleChatUnreadSignal = (data) => {
        const senderId = data?.senderId || data?.sender_id;
        if (senderId && senderId !== user.id && !window.location.pathname.endsWith("/chat")) {
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

  useEffect(() => {
    console.log("Notifications:", notifications);
  }, [notifications]);
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Failed to mark notification read:", err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark all read:", err.message);
    }
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
    <div className="relative">
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
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-tech-line bg-white p-4 shadow-xl animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
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
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-1">
            {/* Unread Chat Banner Item */}
            {hasUnreadChat && (
              <Link
                to={user?.role === "SUPERVISOR" ? "/supervisor/chat" : "/operator/chat"}
                onClick={handleOpenChat}
                className="flex items-start gap-3 p-3 transition rounded-xl my-1 bg-sky-50/90 hover:bg-sky-100/80 border border-sky-100 font-medium"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <MessageSquare size={15} />
                </div>
                <div className="flex-1 text-xs min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-slate-900">Unread Group Chat</span>
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

            {loading && notifications.length === 0 && !hasUnreadChat ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 && !hasUnreadChat ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((item) => {
                const IconComponent = typeIcons[item.type] || Bell;
                const badgeColor = typeColors[item.type] || "bg-slate-100 text-slate-700";
                const isUnread = !item.is_read;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 transition rounded-xl my-1 ${
                      isUnread ? "bg-sky-50/60 font-medium" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor}`}>
                      <IconComponent size={15} />
                    </div>

                    <div className="flex-1 text-xs min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-900 truncate">{item.title}</span>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-tech-blue" />
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px] break-words">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400 border-t border-slate-100/50">
                        <span>
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.link_url && (
                            <Link
                              to={item.link_url.startsWith("/") ? (user?.role === "SUPERVISOR" && !item.link_url.startsWith("/supervisor") ? `/supervisor${item.link_url}` : user?.role === "OPERATOR" && !item.link_url.startsWith("/operator") ? `/operator${item.link_url}` : item.link_url) : item.link_url}
                              onClick={() => setIsOpen(false)}
                              className="font-bold text-tech-blue hover:underline"
                            >
                              View
                            </Link>
                          )}
                          {isUnread && (
                            <button
                              onClick={(e) => handleMarkAsRead(item.id, e)}
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
      )}
    </div>
  );
}
