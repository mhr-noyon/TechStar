import {
  getChatMessages,
  createChatMessage,
} from "../services/chat.service.js";

export async function fetchMessages(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const messages = await getChatMessages(limit);
    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { content } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const senderRole = req.user.role;

    const message = await createChatMessage({
      senderId,
      senderName,
      senderRole,
      content,
    });

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}
