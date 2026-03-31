import { useEffect, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";
import { Link } from "react-router-dom";
import { getSocket } from "../api/socket.js";

function formatNotification(n) {
  if (n.type === "like") return "liked your post";
  if (n.type === "comment") return "commented on your post";
  if (n.type === "follow") return "followed you";
  return "interacted with you";
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const isAuthed = !!getToken();

  const load = async () => {
    const { data } = await api.get("/notifications");
    setItems(data.notifications || []);
  };

  useEffect(() => {
    if (!isAuthed) {
      setError("Login to view notifications.");
      return;
    }
    load().catch(() => setError("Failed to load notifications"));
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    const socket = getSocket();
    const onNotification = (payload) => {
      if (!payload?.notification) return;
      setItems((prev) => [payload.notification, ...prev]);
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [isAuthed]);

  const markAll = async () => {
    await api.post("/notifications/read-all");
    await load();
  };

  if (!isAuthed) {
    return <p className="muted">Login to view notifications.</p>;
  }

  return (
    <section className="card">
      <div className="notif-header">
        <h1>Notifications</h1>
        <button onClick={markAll}>Mark all read</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="notif-list">
        {items.length ? (
          items.map((n) => (
            <div key={n._id} className={`notif-item ${n.read ? "" : "unread"}`}>
              <div className="notif-main">
                <strong>@{n.actor?.username || "user"}</strong> {formatNotification(n)}
              </div>
              <div className="muted small">{new Date(n.createdAt).toLocaleString()}</div>
              {n.post && (
                <div className="muted small">
                  Post: {n.post.content?.slice(0, 80) || "View post"}{" "}
                  <Link to="/">Open feed</Link>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="muted">No notifications yet.</p>
        )}
      </div>
    </section>
  );
}
