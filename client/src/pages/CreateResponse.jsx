import { useEffect, useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";
import { getToken } from "../api/token.js";

// Simple posts list page (replaces the old CreateResponse form)
export default function CreateResponse() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const isAuthed = !!getToken();

  const loadPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/posts?limit=25");
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to load posts", err);
      setError("Could not load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleUpload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const form = new FormData();
    list.forEach((file) => form.append("images", file));
    setUploading(true);
    try {
      const { data } = await api.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (data.urls) {
        setImageUrls(data.urls.map((u) => normalizeMediaUrl(u)));
        setImageUrl("");
      } else if (data.url) {
        setImageUrl(normalizeMediaUrl(data.url));
        setImageUrls([]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!isAuthed) {
      setError("Login to create a post.");
      return;
    }
    if (!content.trim() && !imageUrl && imageUrls.length === 0) return;
    setPosting(true);
    try {
      await api.post("/posts", { content, imageUrl, imageUrls });
      setContent("");
      setImageUrl("");
      setImageUrls([]);
      await loadPosts();
    } catch (err) {
      console.error("Failed to create post", err);
      setError(err.response?.data?.message || "Could not create post.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <section className="card">
        <h1>Posts</h1>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h1>Posts</h1>
        <p className="error">{error}</p>
        <button onClick={loadPosts}>Retry</button>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Posts</h1>

      <form className="card" onSubmit={handleCreatePost} style={{ marginBottom: "16px" }}>
        <h2 className="section-title">Create Post</h2>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="upload-row">
          <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} />
          {uploading && <span className="muted small">Uploading...</span>}
        </div>
        <input
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        {imageUrls.length > 0 ? (
          <div className="carousel">
            <img className="post-image preview" src={imageUrls[0]} alt="Preview" />
            <div className="muted small">+{imageUrls.length - 1} more</div>
          </div>
        ) : (
          imageUrl && <img className="post-image preview" src={imageUrl} alt="Preview" />
        )}
        <button type="submit" disabled={posting || (!content.trim() && !imageUrl && imageUrls.length === 0)}>
          {posting ? "Posting..." : "Post"}
        </button>
      </form>

      {posts.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <div className="list">
          {posts.map((post) => (
            <article key={post._id} className="card post-compact">
              <div className="post-header">
                <strong>@{post.author?.username || "user"}</strong>
                <span className="muted small">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              {post.content && <p>{post.content}</p>}
              {post.images?.length ? (
                <img
                  className="post-image"
                  src={normalizeMediaUrl(post.images[0])}
                  alt="Post"
                />
              ) : post.imageUrl ? (
                <img
                  className="post-image"
                  src={normalizeMediaUrl(post.imageUrl)}
                  alt="Post"
                />
              ) : null}
              {post.videoUrl && (
                <video
                  className="post-video"
                  src={normalizeMediaUrl(post.videoUrl)}
                  controls
                  loop
                />
              )}
              <div className="post-actions">
                <span className="muted small">
                  {post.likes?.length || 0} likes · {post.comments?.length || 0} comments
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
