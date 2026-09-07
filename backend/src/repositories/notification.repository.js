import { supabase } from "../config/database.js";

// In-memory fallback stores
const inMemoryNotifications = [];
const inMemoryUserNotifications = [];

export async function createNotificationRecord({
  service_request_id = null,
  chat_message_id = null,
  type,
  message,
}) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        service_request_id,
        chat_message_id,
        type,
        message,
      })
      .select(`
        id,
        service_request_id,
        chat_message_id,
        type,
        message,
        created_at
      `)
      .single();

    if (error) {
      console.warn(
        "Could not create notification:",
        error.message
      );

      return null;
    }

    return data;
  } catch (err) {
    console.warn(
      "createNotificationRecord exception:",
      err.message
    );

    return null;
  }
}

export async function createUserNotificationTrackRows(targetUserIds, notificationId) {
  if (!targetUserIds || targetUserIds.length === 0) return [];

  const now = new Date().toISOString();
  const rowsToInsert = targetUserIds.map((userId) => ({
    notification_id: notificationId,
    user_id: userId,
    is_read: false,
    created_at: now,
  }));

  try {
    const { data, error } = await supabase
      .from("user_notification_track")
      .insert(rowsToInsert)
      .select("*");

    if (error) {
      console.warn("Could not insert user_notification_track rows, using in-memory fallback:", error.message);
      const fallbackRows = rowsToInsert.map((row) => ({
        id: "unotif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        ...row,
      }));
      inMemoryUserNotifications.push(...fallbackRows);
      return fallbackRows;
    }

    inMemoryUserNotifications.push(...(data || []));
    return data;
  } catch (err) {
    console.warn("createUserNotificationTrackRows exception:", err.message);
    const fallbackRows = rowsToInsert.map((row) => ({
      id: "unotif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      ...row,
    }));
    inMemoryUserNotifications.push(...fallbackRows);
    return fallbackRows;
  }
}



export async function findUserNotifications(userId, limit = 50) {
  try {
    const { data, error } = await supabase.rpc(
      "get_user_notifications",
      {
        p_user_id: userId,
        p_limit: limit,
      }
    );
    console.log("findUserNotifications data:", data);
    if (error) {
      console.warn(
        "Could not query user notifications:",
        error.message
      );
      return null;
    }

    return data || [];
  } catch (err) {
    console.warn(
      "findUserNotifications exception:",
      err.message
    );
    return null;
  }
}

// export async function findUserNotifications(userId, limit = 50) {
//   try {
//     let { data, error } = await supabase
//       .from("user_notifications")
//       .select("id, notification_id, user_id, is_read, read_at, created_at")
//       .eq("user_id", userId)
//       .order("created_at", { ascending: false })
//       .limit(limit);

//       console.log("findUserNotifications data:", data);

//     if (error) {
//       console.warn("Could not query user_notifications DB, using in-memory store:", error.message);
//       return getInMemoryUserNotifications(userId, limit);
//     }

//     const notifIds = Array.from(new Set((data || []).map((un) => un.notification_id).filter(Boolean)));
//     let notifMap = {};
//     if (notifIds.length > 0) {
//       const { data: parentNotifs } = await supabase
//         .from("notifications")
//         .select("*")
//         .in("id", notifIds);

//       if (Array.isArray(parentNotifs)) {
//         parentNotifs.forEach((n) => {
//           notifMap[n.id] = n;
//         });
//       }
//     }

//     const dbItems = (data || []).map((un) => {
//       const parent = notifMap[un.notification_id] || {};
//       return {
//         id: un.id,
//         notification_id: un.notification_id,
//         user_id: un.user_id,
//         is_read: un.is_read,
//         read_at: un.read_at,
//         created_at: un.created_at,
//         title: parent.title || "System Notification",
//         message: parent.message || "",
//         type: parent.type || "SYSTEM",
//         link_url: parent.link_url || null,
//         metadata: parent.metadata || {},
//       };
//     });

//     const memoryItems = getInMemoryUserNotifications(userId, limit);
//     const combined = [...dbItems];
//     memoryItems.forEach((mem) => {
//       const existing = combined.find(
//         (item) => item.id === mem.id || item.notification_id === mem.notification_id
//       );
//       if (!existing) {
//         combined.push(mem);
//       }
//     });

//     return combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
//   } catch (err) {
//     console.warn("findUserNotifications exception:", err.message);
//     return getInMemoryUserNotifications(userId, limit);
//   }
// }

// function getInMemoryUserNotifications(userId, limit = 50) {
//   return inMemoryUserNotifications
//     .filter((un) => un.user_id === userId)
//     .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
//     .slice(0, limit)
//     .map((un) => {
//       const parent = inMemoryNotifications.find((n) => n.id === un.notification_id) || {};
//       return {
//         id: un.id,
//         notification_id: un.notification_id,
//         user_id: un.user_id,
//         is_read: un.is_read,
//         read_at: un.read_at,
//         created_at: un.created_at,
//         title: parent.title || "System Notification",
//         message: parent.message || "",
//         type: parent.type || "SYSTEM",
//         link_url: parent.link_url || null,
//         metadata: parent.metadata || {},
//       };
//     });
// }

export async function countUnreadUserNotifications(userId) {
  try {
    const { data, error } = await supabase.rpc(
      "count_unread_user_notifications",
      {
        p_user_id: userId,
      }
    );

    if (error) {
      console.warn(
        "Could not count unread notifications:",
        error.message
      );

      return 0;
    }

    return data || 0;
  } catch (err) {
    console.warn(
      "countUnreadUserNotifications exception:",
      err.message
    );

    return 0;
  }
}

export async function markUserNotificationAsRead(
  userId,
  notificationId
) {
  try {
    const { data, error } = await supabase
      .from("user_notification_track")
      .upsert(
        {
          notification_id: notificationId,
          user_id: userId,
          is_read: true,
        },
        {
          onConflict: "notification_id,user_id",
        }
      )
      .select(`
        id,
        notification_id,
        user_id,
        is_read
      `)
      .single();

    // Debug logs (optional)
    console.log("User ID:", userId);
    console.log("Notification ID:", notificationId);
    if (error) {
      console.warn(
        "Could not mark notification as read:",
        error.message
      );

      return null;
    }

    return data;
  } catch (err) {
    console.warn(
      "markUserNotificationAsRead exception:",
      err.message
    );

    return null;
  }
}

export async function markAllUserNotificationsAsRead(userId) {
  try {
    const { data, error } = await supabase.rpc(
      "mark_all_user_notifications_as_read",
      {
        p_user_id: userId,
      }
    );

    if (error) {
      console.warn(
        "Could not mark all notifications as read:",
        error.message
      );

      return null;
    }

    return data;
  } catch (err) {
    console.warn(
      "markAllUserNotificationsAsRead exception:",
      err.message
    );

    return null;
  }
}