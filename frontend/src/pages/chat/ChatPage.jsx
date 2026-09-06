import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, ShieldCheck, UserCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { getServiceRequestSocket } from "../../sockets/serviceRequest.socket";

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadMessages = () => {
    setLoading(true);
    apiRequest("/chat/messages")
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.warn("Failed to load chat history:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();

    const socket = getServiceRequestSocket();
    if (socket && user?.id) {
      socket.emit("joinUser", user.id);
      socket.emit("joinRole", user.role);

      const handleIncomingMessage = (newMsg) => {
        if (!newMsg) return;
        setMessages((prev) => {
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
      };

      socket.on("chat:message", handleIncomingMessage);
      return () => {
        socket.off("chat:message", handleIncomingMessage);
      };
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
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
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-tech-blue">
            Communication
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Staff Group Chat</h1>
          <p className="mt-1 text-sm text-tech-muted">
            Live real-time messaging between authorized Operators and Supervisors.
          </p>
        </div>
        <button
          onClick={loadMessages}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw size={14} />
          Refresh Chat
        </button>
      </div>

      {/* Chat Container Card */}
      <div className="flex h-[600px] flex-col rounded-2xl border border-tech-line bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tech-blue font-bold text-white shadow-md">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">TechStar Staff Channel</h2>
              <p className="text-xs text-slate-400 font-medium">Real-time WebSocket Live Chat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">Live Connected</span>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Loading chat messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare size={40} className="mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No messages sent yet</p>
              <p className="text-xs text-slate-500 mt-1">Be the first to post a message to staff!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              const formattedTime = new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={msg.id ? `${msg.id}-${index}` : index}
                  className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Sender Avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${
                      msg.sender_role === "SUPERVISOR"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-sky-100 text-sky-800 border border-sky-300"
                    }`}
                  >
                    {msg.sender_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className={`max-w-[70%] ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-slate-800">{msg.sender_name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          msg.sender_role === "SUPERVISOR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {msg.sender_role === "SUPERVISOR" ? "Supervisor" : "Operator"}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs break-words ${
                        isMe
                          ? "bg-tech-blue text-white rounded-tr-none"
                          : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 block mt-1 px-1">
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Messenger-style Auto-expanding Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-3 border-t border-slate-200 bg-white p-3.5"
        >
          <div className="flex-1 relative flex items-center min-h-[42px] max-h-[140px] bg-slate-100 border border-slate-200 rounded-2xl focus-within:border-tech-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-tech-blue/20 transition px-3.5 py-2">
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
                  el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
                }
              }}
              placeholder="Type a message... (Shift + Enter for new line)"
              className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none resize-none leading-relaxed max-h-[130px] overflow-y-auto"
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex h-10 px-4 rounded-xl bg-tech-blue hover:bg-sky-600 text-white font-bold text-xs items-center gap-2 transition disabled:opacity-40 cursor-pointer shadow-md shrink-0 mb-0.5"
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
