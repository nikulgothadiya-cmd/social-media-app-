import { useEffect, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const isAuthed = !!getToken();

  const load = async () => {
    const { data } = await api.get("/users/me/bookmarks");
    setPosts(data.posts || []);
  };

  useEffect(() => {
    if (!isAuthed) {
      setError("Login to view saved posts.");
      return;
    }
    load().catch(() => setError("Failed to load saved posts"));
  }, [isAuthed]);

  if (!isAuthed) {
    return <p className="muted">Login to view saved posts.</p>;
  }

  return (
    <section>
      <h1>Saved Posts</h1>
      {error && <p className="error">{error}</p>}
      <div className="list">
        {posts.length ? (
          posts.map((post) => (
            <article key={post._id} className="card">
              <div className="post-header">
                <strong>@{post.author?.username || "user"}</strong>
                <span className="muted">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p>{post.content}</p>
              {post.videoUrl && <video className="post-video" src={post.videoUrl} controls loop />}
              {post.images?.length ? (
                <div>
                  <img className="post-image" src={post.images[0]} alt="Post" />
                  {post.images.length > 1 && (
                    <span className="muted small">+{post.images.length - 1} more</span>
                  )}
                </div>
              ) : (
                post.imageUrl && <img className="post-image" src={post.imageUrl} alt="Post" />
              )}
            </article>
          ))
        ) : (
          <p className="muted">No saved posts yet.</p>
        )}
      </div>
    </section>
  );
}
