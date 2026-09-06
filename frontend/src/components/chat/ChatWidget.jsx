import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest } from "../../services/api.js";
import { getServiceRequestSocket } from "../../sockets/serviceRequest.socket.js";

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Load chat history and subscribe to Socket.io events
  useEffect(() => {
    if (!user) return;

    // Fetch message history
    apiRequest("/chat/messages")
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch((err) => console.warn("Could not load chat messages:", err.message));

    // Listen to WebSocket live chat messages
    const socket = getServiceRequestSocket();
    if (socket) {
      const handleIncomingMessage = (newMsg) => {
        if (!newMsg) return;
        setMessages((prev) => {
          // Avoid duplicate messages
          if (
            prev.some(
              (m) =>
                m.id === newMsg.id ||
                (m.sender_id === newMsg.sender_id &&
                  m.content === newMsg.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 3000)
            )
          ) {
            return prev;
          }
          return [...prev, newMsg];
        });

        setUnreadCount((prev) => (isOpen ? 0 : prev + 1));
      };

      socket.on("chat:message", handleIncomingMessage);

      return () => {
        socket.off("chat:message", handleIncomingMessage);
      };
    }
  }, [user, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  if (!user || (user.role !== "OPERATOR" && user.role !== "SUPERVISOR")) {
    return null;
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      // Send via REST API (which saves to DB and broadcasts via Socket)
      const newMsg = await apiRequest("/chat/messages", {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      if (newMsg && newMsg.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      // Fallback via socket if REST API encounters error
      const socket = getServiceRequestSocket();
      if (socket) {
        socket.emit("chat:send", {
          sender_id: user.id,
          sender_name: user.name,
          sender_role: user.role,
          content,
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Panel Drawer */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-tech-blue flex items-center justify-center text-white font-bold text-xs">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="text-xs font-extrabold tracking-tight">Staff Group Chat</h3>
                <p className="text-[10px] text-slate-400 font-medium">Real-time Operator & Supervisor Channel</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <MessageSquare size={32} className="mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No chat messages yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Start a conversation with operators and supervisors!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;
                const formattedTime = new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id ? `${msg.id}-${index}` : index}
                    className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Sender Profile Demo Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-sm ${
                        msg.sender_role === "SUPERVISOR"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-sky-100 text-sky-800 border border-sky-300"
                      }`}
                    >
                      {msg.sender_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className={`max-w-[75%] ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                      {/* Sender Name & Role Badge */}
                      <div className="flex items-center gap-1.5 mb-1 px-0.5">
                        <span className="text-[10px] font-bold text-slate-700">{msg.sender_name}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            msg.sender_role === "SUPERVISOR"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {msg.sender_role === "SUPERVISOR" ? "Supervisor" : "Operator"}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`p-2.5 rounded-2xl text-xs font-medium leading-relaxed break-words shadow-sm ${
                          isMe
                            ? "bg-tech-blue text-white rounded-tr-none"
                            : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>

                      <span className="text-[9px] font-medium text-slate-400 block mt-1 px-1">
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Messenger-style Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-end gap-2"
          >
            <div className="flex-1 relative flex items-center min-h-[38px] max-h-[110px] bg-slate-100 border border-slate-200 rounded-2xl focus-within:border-tech-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-tech-blue/20 transition px-3 py-1.5">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none resize-none leading-relaxed max-h-[100px] overflow-y-auto"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-9 h-9 rounded-xl bg-tech-blue hover:bg-sky-600 text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shrink-0 mb-0.5"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-13 h-13 rounded-2xl bg-tech-blue hover:bg-sky-600 text-white shadow-xl hover:scale-105 transition transform active:scale-95 cursor-pointer"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}

        {/* Unread Message Badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
