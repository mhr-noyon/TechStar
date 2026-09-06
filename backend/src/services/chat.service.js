import {
  findRecentChatMessages,
  saveChatMessage,
} from "../repositories/chat.repository.js";

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

  // Broadcast chat message and unread signal to connected WebSockets
  const io = globalThis.serviceRequestSocketServer;
  if (io) {
    io.emit("chat:message", message);
    io.to("operators").to("supervisors").emit("chat:unread", {
      senderId,
      messageId: message.id,
      created_at: message.created_at,
    });
  }

  return message;
}
