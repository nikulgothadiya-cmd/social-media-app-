import { useEffect, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const isAuthed = !!getToken();

  const load = async () => {
    const [u, p] = await Promise.all([api.get("/admin/users"), api.get("/admin/posts")]);
    setUsers(u.data.users || []);
    setPosts(p.data.posts || []);
  };

  useEffect(() => {
    if (!isAuthed) {
      setError("Login required.");
      return;
    }
    load().catch(() => setError("Admin access required."));
  }, [isAuthed]);

  const toggleBan = async (id) => {
    await api.post(`/admin/users/${id}/ban`);
    await load();
  };

  const toggleVerify = async (id) => {
    await api.post(`/admin/users/${id}/verify`);
    await load();
  };

  const deletePost = async (id) => {
    await api.delete(`/admin/posts/${id}`);
    await load();
  };

  return (
    <section>
      <h1>Admin</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2 className="section-title">Users</h2>
        {users.map((user) => (
          <div key={user._id} className="admin-item">
            <div>
              <strong>@{user.username}</strong> <span className="muted small">{user.email}</span>
              <span className="muted small">Role: {user.role}</span>
            </div>
            <div className="admin-actions">
              <button onClick={() => toggleVerify(user._id)}>
                {user.verified ? "Unverify" : "Verify"}
              </button>
              <button onClick={() => toggleBan(user._id)}>
                {user.isBanned ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title">Posts</h2>
        {posts.map((post) => (
          <div key={post._id} className="admin-item">
            <div>
              <strong>@{post.author?.username || "user"}</strong>
              <span className="muted small">{post.content?.slice(0, 80)}</span>
            </div>
            <button className="danger" onClick={() => deletePost(post._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
