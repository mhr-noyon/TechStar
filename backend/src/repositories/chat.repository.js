import { supabase } from "../config/database.js";

// In-memory fallback stores
const inMemoryChatMessages = [];

export async function findRecentChatMessages(limit = 50) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, sender_id, content, created_at, user:users!sender_id (id, name, role)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Could not query chat_messages table, using in-memory store:", error.message);
      return inMemoryChatMessages.slice(-limit);
    }

    return (data || []).reverse().map((msg) => ({
      id: msg.id,
      chat_message_id: msg.id,
      sender_id: msg.sender_id,
      sender_name: msg.user?.name || "Staff Member",
      sender_role: msg.user?.role || "OPERATOR",
      content: msg.content,
      created_at: msg.created_at,
    }));
  } catch (err) {
    console.warn("Chat repository query error:", err.message);
    return inMemoryChatMessages.slice(-limit);
  }
}

export async function saveChatMessage({ senderId, senderName, senderRole, content }) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        sender_id: senderId,
        content,
      })
      .select("id, sender_id, content, created_at, user:users!sender_id (id, name, role)")
      .single();

    if (error) {
      console.warn("Could not save to chat_messages table, using in-memory store:", error.message);
      const fallbackId = "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      const fallbackMsg = {
        id: fallbackId,
        chat_message_id: fallbackId,
        sender_id: senderId,
        sender_name: senderName || "Staff Member",
        sender_role: senderRole || "OPERATOR",
        content,
        created_at: new Date().toISOString(),
      };
      inMemoryChatMessages.push(fallbackMsg);
      return fallbackMsg;
    }

    const formattedMsg = {
      id: data.id,
      chat_message_id: data.id,
      sender_id: data.sender_id,
      sender_name: data.user?.name || senderName || "Staff Member",
      sender_role: data.user?.role || senderRole || "OPERATOR",
      content: data.content,
      created_at: data.created_at,
    };
    inMemoryChatMessages.push(formattedMsg);
    return formattedMsg;
  } catch (err) {
    console.warn("Chat repository save error:", err.message);
    const fallbackId = "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const fallbackMsg = {
      id: fallbackId,
      chat_message_id: fallbackId,
      sender_id: senderId,
      sender_name: senderName || "Staff Member",
      sender_role: senderRole || "OPERATOR",
      content,
      created_at: new Date().toISOString(),
    };
    inMemoryChatMessages.push(fallbackMsg);
    return fallbackMsg;
  }
}
