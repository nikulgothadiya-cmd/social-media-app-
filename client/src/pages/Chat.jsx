import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";
import { getSocket, resetSocket } from "../api/socket.js";

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [online, setOnline] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState("");
  const [activeRoomId, setActiveRoomId] = useState("global");
  const [me, setMe] = useState(null);
  const typingTimeout = useRef(null);
  const isAuthed = !!getToken();

  const roomLabel = useMemo(() => {
    if (!selectedUser) return "global";
    return `dm:${selectedUser.username}`;
  }, [selectedUser]);

  useEffect(() => {
    if (!isAuthed) {
      setError("Login required to use chat.");
      return;
    }
    api
      .get("/chat/users")
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => setError("Failed to load users"));
    api
      .get("/users/me")
      .then(({ data }) => setMe(data.user))
      .catch(() => setMe(null));
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    const socket = getSocket();

    const onPresence = (payload) => {
      setOnline((prev) => {
        const next = new Set(prev);
        if (payload.online) {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const onPresenceList = (payload) => {
      const next = new Set(payload?.users || []);
      setOnline(next);
    };

    const onTyping = (payload) => {
      if (!payload?.userId) return;
      if (payload.roomId && payload.roomId !== activeRoomId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (payload.isTyping) {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const onMessage = (payload) => {
      if (!payload?.message) return;
      if (payload.message.roomId !== activeRoomId) return;
      setMessages((prev) => [...prev, payload.message]);
      if (selectedUser && payload.message.sender?._id === selectedUser._id) {
        const socket = getSocket();
        socket.emit("dm:read", { userId: selectedUser._id });
      }
    };

    const onRead = (payload) => {
      if (!payload?.roomId || payload.roomId !== activeRoomId) return;
      const readerId = payload.userId;
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.readBy) return msg;
          if (msg.readBy.includes(readerId)) return msg;
          return { ...msg, readBy: [...msg.readBy, readerId] };
        })
      );
    };

    const onReact = (payload) => {
      if (!payload?.messageId) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id !== payload.messageId) return msg;
          return { ...msg, reactions: payload.reactions };
        })
      );
    };

    socket.on("presence:update", onPresence);
    socket.on("presence:list", onPresenceList);
    socket.on("typing", onTyping);
    socket.on("message", onMessage);
    socket.on("dm:read", onRead);
    socket.on("message:react", onReact);

    return () => {
      socket.off("presence:update", onPresence);
      socket.off("presence:list", onPresenceList);
      socket.off("typing", onTyping);
      socket.off("message", onMessage);
      socket.off("dm:read", onRead);
      socket.off("message:react", onReact);
      clearTimeout(typingTimeout.current);
    };
  }, [isAuthed, activeRoomId]);

  const loadMessages = async (user) => {
    if (!isAuthed) return;
    if (!user) {
      const { data } = await api.get("/chat/messages?roomId=global");
      setActiveRoomId(data.roomId || "global");
      setMessages(data.messages || []);
      setTypingUsers(new Set());
    } else {
      const { data } = await api.get(`/chat/messages?recipientId=${user._id}`);
      setActiveRoomId(data.roomId);
      setMessages(data.messages || []);
      setTypingUsers(new Set());
      const socket = getSocket();
      socket.emit("dm:join", { userId: user._id });
      socket.emit("dm:read", { userId: user._id });
    }
  };

  useEffect(() => {
    loadMessages(selectedUser).catch(() => setError("Failed to load messages"));
  }, [selectedUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const socket = getSocket();
    if (selectedUser) {
      socket.emit("message", { recipientId: selectedUser._id, content: text });
    } else {
      socket.emit("message", { roomId: "global", content: text });
    }
    setInput("");
  };

  const handleReact = (messageId, emoji) => {
    const socket = getSocket();
    socket.emit("message:react", { messageId, emoji });
  };

  const handleTyping = (value) => {
    setInput(value);
    const socket = getSocket();
    if (!selectedUser) {
      socket.emit("typing", { roomId: "global", isTyping: true });
    } else {
      socket.emit("typing", { recipientId: selectedUser._id, isTyping: true });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (!selectedUser) socket.emit("typing", { roomId: "global", isTyping: false });
      else socket.emit("typing", { recipientId: selectedUser._id, isTyping: false });
    }, 700);
  };

  if (!isAuthed) {
    return <p className="muted">Login to use chat.</p>;
  }

  return (
    <section className="chat">
      <aside className="chat-sidebar card">
        <h2 className="section-title">Messages</h2>
        <button
          className={`chat-item ${!selectedUser ? "active" : ""}`}
          onClick={() => setSelectedUser(null)}
        >
          <span className="status-dot" />
          Global room
        </button>
        <div className="chat-list">
          {users.map((user) => (
            <button
              key={user._id}
              className={`chat-item ${selectedUser?._id === user._id ? "active" : ""}`}
              onClick={() => setSelectedUser(user)}
            >
              <span className={`status-dot ${online.has(user._id) ? "online" : ""}`} />
              <span>
                @{user.username}
                {user.verified && <span className="badge-verified">✓</span>}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="chat-panel card">
        <div className="chat-header">
          <h2>
            {selectedUser ? `@${selectedUser.username}` : "Global room"}
            {selectedUser?.verified && <span className="badge-verified">✓</span>}
          </h2>
          <span className="muted small">
            {selectedUser
              ? online.has(selectedUser._id)
                ? "Online"
                : "Offline"
              : "Public"}
          </span>
          <span className="muted small">{roomLabel}</span>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => {
            const isMine = me && (msg.sender?._id === me._id || msg.sender === me._id);
            const readByOther =
              selectedUser &&
              msg.readBy &&
              msg.readBy.some((id) => id.toString() === selectedUser._id);
            return (
              <div key={msg._id || `${msg.createdAt}-${msg.sender?._id}`} className="chat-message">
                <div className="chat-message-header">
                  <strong>@{msg.sender?.username || "user"}</strong>
                  <span className="muted small">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p>{msg.content}</p>
                <div className="chat-message-footer">
                  <div className="reactions">
                    {msg.reactions?.map((r, idx) => (
                      <span key={`${r.emoji}-${idx}`} className="reaction">
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                  <div className="reaction-buttons">
                    {["👍", "🔥", "😂"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="linklike"
                        onClick={() => handleReact(msg._id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {selectedUser && isMine && (
                    <span className="muted small">{readByOther ? "Read" : "Sent"}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {typingUsers.size > 0 && (
          <p className="muted small">Someone is typing...</p>
        )}

        <form className="chat-input" onSubmit={handleSend}>
          <input
            placeholder="Write a message..."
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </section>
  );
}
