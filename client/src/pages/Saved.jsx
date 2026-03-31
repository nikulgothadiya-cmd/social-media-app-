import { useEffect, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";
import PostItem from "../components/PostItem.jsx";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const [analyticsPost, setAnalyticsPost] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const isAuthed = !!getToken();

  const loadSavedPosts = async () => {
    try {
      const { data } = await api.get("/users/me/bookmarks");
      setPosts(data.posts || []);
      const ids = new Set((data.posts || []).map((p) => p._id));
      setBookmarkIds(ids);
    } catch (err) {
      setError("Failed to load saved posts");
      console.error(err);
    }
  };

  const loadMe = async () => {
    try {
      const { data } = await api.get("/users/me");
      setMe(data.user);
    } catch (err) {
      console.error("Failed to load current user", err);
    }
  };

  useEffect(() => {
    if (!isAuthed) {
      setError("Login to view saved posts.");
      return;
    }
    loadSavedPosts();
    loadMe();
  }, [isAuthed]);

  const isAuthor = (post) => {
    const authorId = post.author?._id || post.author;
    const myId = me?._id || me?.id;
    return !!authorId && !!myId && authorId.toString() === myId.toString();
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      await loadSavedPosts();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const handleAnalytics = async (post) => {
    setAnalyticsPost(post);
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get(`/posts/${post._id}/analytics`);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Analytics error", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (!isAuthed) {
    return (
      <section className="card">
        <h1>Saved Posts</h1>
        <p className="muted">Login to view saved posts.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Saved Posts</h1>
      {error && <p className="error">{error}</p>}
      <div className="list">
        {posts.length ? (
          posts.map((post) => (
            <PostItem
              key={post._id}
              post={post}
              isAuthed={isAuthed}
              isAuthor={isAuthor(post)}
              onDelete={handleDelete}
              onAnalytics={handleAnalytics}
              bookmarkIds={bookmarkIds}
              onBookmarkChange={loadSavedPosts}
              onTagClick={() => {}}
              onEdit={loadSavedPosts}
            />
          ))
        ) : (
          <p className="muted">No saved posts yet. Start saving posts from the feed!</p>
        )}
      </div>

      {analyticsPost && (
        <div className="modal-overlay" onClick={() => setAnalyticsPost(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Post Analytics</h2>
            {analyticsLoading ? (
              <p className="muted">Loading...</p>
            ) : (
              <>
                <p className="muted">Views: {analyticsData?.views || 0}</p>
                <p className="muted">Likes: {analyticsData?.likes || 0}</p>
                <div className="analytics-grid">
                  <div>
                    <h3 className="section-title">Views (7 days)</h3>
                    {(analyticsData?.viewsByDay || []).map((item) => (
                      <div key={item._id} className="muted small">
                        {item._id}: {item.count}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="section-title">Likes (7 days)</h3>
                    {(analyticsData?.likesByDay || []).map((item) => (
                      <div key={item._id} className="muted small">
                        {item._id}: {item.count}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <button onClick={() => setAnalyticsPost(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}

