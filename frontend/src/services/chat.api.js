import { apiRequest } from "./api";

export const chatApi = {
  getMessages: (limit = 50) => apiRequest(`/chat/messages?limit=${limit}`),
  sendMessage: (content) =>
    apiRequest("/chat/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
