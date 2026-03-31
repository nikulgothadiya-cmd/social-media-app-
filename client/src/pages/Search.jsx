import { useState } from "react";
import api from "../api/client.js";
import { Link } from "react-router-dom";

export default function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    if (!query.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setUsers(data.users || []);
      setPosts(data.posts || []);
    } catch {
      setError("Search failed");
    }
  };

  return (
    <section>
      <h1>Search</h1>
      <form className="card" onSubmit={handleSearch}>
        <input
          placeholder="Search users or posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
        {error && <p className="error">{error}</p>}
      </form>

      <div className="card">
        <h2 className="section-title">Users</h2>
        {users.length ? (
          users.map((user) => (
            <div key={user._id} className="search-item">
              <Link to={`/u/${user.username}`}>
                @{user.username}
                {user.verified && <span className="badge-verified">✓</span>}
              </Link>
              <span className="muted small">{user.bio}</span>
            </div>
          ))
        ) : (
          <p className="muted">No users found.</p>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Posts</h2>
        {posts.length ? (
          posts.map((post) => (
            <article key={post._id} className="card">
              <div className="post-header">
                <strong>@{post.author?.username || "user"}</strong>
                <span className="muted">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p>{post.content}</p>
            </article>
          ))
        ) : (
          <p className="muted">No posts found.</p>
        )}
      </div>
    </section>
  );
}
