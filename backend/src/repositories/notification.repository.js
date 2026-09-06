import { supabase } from "../config/database.js";

// In-memory fallback stores
const inMemoryNotifications = [];
const inMemoryUserNotifications = [];

export async function createNotificationRecord({ title, message, type, link_url, metadata = {} }) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        type,
        link_url,
        metadata,
      })
      .select("*")
      .single();

    if (error) {
      console.warn("Could not insert notification to DB, using in-memory store:", error.message);
      const fallback = {
        id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        title,
        message,
        type,
        link_url,
        metadata,
        created_at: new Date().toISOString(),
      };
      inMemoryNotifications.push(fallback);
      return fallback;
    }

    inMemoryNotifications.push(data);
    return data;
  } catch (err) {
    console.warn("createNotificationRecord exception:", err.message);
    const fallback = {
      id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title,
      message,
      type,
      link_url,
      metadata,
      created_at: new Date().toISOString(),
    };
    inMemoryNotifications.push(fallback);
    return fallback;
  }
}

export async function createUserNotificationRecords(targetUserIds, notificationId) {
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
      .from("user_notifications")
      .insert(rowsToInsert)
      .select("*");

    if (error) {
      console.warn("Could not insert user_notifications to DB, using in-memory store:", error.message);
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
    console.warn("createUserNotificationRecords exception:", err.message);
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
    let { data, error } = await supabase
      .from("user_notifications")
      .select("id, notification_id, user_id, is_read, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Could not query user_notifications DB, using in-memory store:", error.message);
      return getInMemoryUserNotifications(userId, limit);
    }

    const notifIds = Array.from(new Set((data || []).map((un) => un.notification_id).filter(Boolean)));
    let notifMap = {};
    if (notifIds.length > 0) {
      const { data: parentNotifs } = await supabase
        .from("notifications")
        .select("*")
        .in("id", notifIds);

      if (Array.isArray(parentNotifs)) {
        parentNotifs.forEach((n) => {
          notifMap[n.id] = n;
        });
      }
    }

    const dbItems = (data || []).map((un) => {
      const parent = notifMap[un.notification_id] || {};
      return {
        id: un.id,
        notification_id: un.notification_id,
        user_id: un.user_id,
        is_read: un.is_read,
        read_at: un.read_at,
        created_at: un.created_at,
        title: parent.title || "System Notification",
        message: parent.message || "",
        type: parent.type || "SYSTEM",
        link_url: parent.link_url || null,
        metadata: parent.metadata || {},
      };
    });

    const memoryItems = getInMemoryUserNotifications(userId, limit);
    const combined = [...dbItems];
    memoryItems.forEach((mem) => {
      const existing = combined.find(
        (item) => item.id === mem.id || item.notification_id === mem.notification_id
      );
      if (!existing) {
        combined.push(mem);
      }
    });

    return combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
  } catch (err) {
    console.warn("findUserNotifications exception:", err.message);
    return getInMemoryUserNotifications(userId, limit);
  }
}

function getInMemoryUserNotifications(userId, limit = 50) {
  return inMemoryUserNotifications
    .filter((un) => un.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
    .map((un) => {
      const parent = inMemoryNotifications.find((n) => n.id === un.notification_id) || {};
      return {
        id: un.id,
        notification_id: un.notification_id,
        user_id: un.user_id,
        is_read: un.is_read,
        read_at: un.read_at,
        created_at: un.created_at,
        title: parent.title || "System Notification",
        message: parent.message || "",
        type: parent.type || "SYSTEM",
        link_url: parent.link_url || null,
        metadata: parent.metadata || {},
      };
    });
}

export async function countUnreadUserNotifications(userId) {
  let dbCount = 0;
  try {
    const { count, error } = await supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      dbCount = count || 0;
    }
  } catch (err) {
    // Ignore error
  }

  const memCount = inMemoryUserNotifications.filter(
    (un) => un.user_id === userId && !un.is_read
  ).length;

  return dbCount + memCount;
}

export async function markUserNotificationAsRead(userId, userNotificationId) {
  const now = new Date().toISOString();
  // Always update in-memory store
  const memMatch = inMemoryUserNotifications.find(
    (un) => (un.id === userNotificationId || un.notification_id === userNotificationId) && un.user_id === userId
  );
  if (memMatch) {
    memMatch.is_read = true;
    memMatch.read_at = now;
  }

  try {
    const { data, error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: now })
      .eq("id", userNotificationId)
      .eq("user_id", userId)
      .select("*");

    if (error || !data || data.length === 0) {
      // Try updating by notification_id if userNotificationId passed was parent ID
      const { data: dataByNotif } = await supabase
        .from("user_notifications")
        .update({ is_read: true, read_at: now })
        .eq("notification_id", userNotificationId)
        .eq("user_id", userId)
        .select("*");

      return dataByNotif?.[0] || memMatch || { id: userNotificationId, is_read: true, read_at: now };
    }

    return data[0];
  } catch (err) {
    return memMatch || { id: userNotificationId, is_read: true, read_at: now };
  }
}

export async function markAllUserNotificationsAsRead(userId) {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: now })
      .eq("user_id", userId)
      .eq("is_read", false);

    inMemoryUserNotifications.forEach((un) => {
      if (un.user_id === userId) {
        un.is_read = true;
        un.read_at = now;
      }
    });

    if (error) return true;
    return true;
  } catch (err) {
    inMemoryUserNotifications.forEach((un) => {
      if (un.user_id === userId) {
        un.is_read = true;
        un.read_at = now;
      }
    });
    return true;
  }
}
