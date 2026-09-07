import {
  findRecentChatMessages,
  saveChatMessage,
} from "../repositories/chat.repository.js";

import { createAndDistributeNotification } from "../services/notification.service.js";

export async function getChatMessages(limit) {
  return await findRecentChatMessages(limit);
}

export async function createChatMessage({ senderId, senderName, senderRole, content }) {
  if (!content || !content.trim()) {
    throw new Error("Message content cannot be empty");
  }

  const trimmedContent = content.trim();

  const message = await saveChatMessage({
    senderId,
    senderName,
    senderRole,
    content: trimmedContent,
  });

  // Log the saved message (use the fields returned by saveChatMessage)
  console.log("Creating chat notification");
  console.log("Message chat_message_id: ", message.chat_message_id);
  console.log("Message content: ", message.content);
  console.log("Message sender id: ", message.sender_id);
  console.log("Message sender name: ", message.sender_name);
  console.log("Message sender role: ", message.sender_role);
  console.log("Message created at: ", message.created_at);
  console.log("Full message object:", message);

  // Create CHAT notification. The sender is excluded.
  await createAndDistributeNotification({
    chat_message_id: message.chat_message_id,
    type: "CHAT",
    message: trimmedContent,
    targetRoles: ["OPERATOR", "SUPERVISOR"],
    excludeUserId: senderId,
  });

  // Broadcast chat message and unread signal to connected WebSockets
  const io = globalThis.serviceRequestSocketServer;
  if (io) {
    io.emit("chat:message", message);
    io.to("operators").to("supervisors").emit("chat:unread", {
      senderId,
      messageId: message.id,
      created_at: message.created_at,
    });
    console.log("Sending message io");
  }
  console.log("Sending message completed");

  return message;
}
