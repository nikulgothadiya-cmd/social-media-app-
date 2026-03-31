import { useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";

export default function PostItem({
  post,
  isAuthed = false,
  isAuthor = false,
  onDelete = () => {},
  onAnalytics = () => {},
  bookmarkIds = new Set(),
  onBookmarkChange = () => {},
  onTagClick = () => {},
  onEdit = () => {}
}) {
  const [busy, setBusy] = useState(false);
  const isBookmarked = bookmarkIds.has(post?._id);

  const handleBookmarkToggle = async () => {
    if (!isAuthed || !post?._id) return;
    setBusy(true);
    try {
      if (isBookmarked) {
        await api.delete(`/users/me/bookmarks/${post._id}`);
      } else {
        await api.post(`/users/me/bookmarks/${post._id}`);
      }
      onBookmarkChange();
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    } finally {
      setBusy(false);
    }
  };

  if (!post) return null;

  const primaryImage =
    post.images?.length ? normalizeMediaUrl(post.images[0]) : normalizeMediaUrl(post.imageUrl);
  const videoUrl = normalizeMediaUrl(post.videoUrl);

  return (
    <article className="card post-compact">
      <div className="post-header">
        <strong>@{post.author?.username || "user"}</strong>
        <span className="muted">
          {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
        </span>
      </div>

      <p>{post.content}</p>

      {videoUrl && (
        <video className="post-video" src={videoUrl} controls loop />
      )}

      {primaryImage ? (
        <img className="post-image" src={primaryImage} alt="Post" />
      ) : null}

      {post.tags?.length ? (
        <div className="tag-row">
          {post.tags.map((tag) => (
            <button
              key={tag}
              className="tag"
              onClick={() => onTagClick(tag)}
              disabled={busy}
            >
              #{tag}
            </button>
          ))}
        </div>
      ) : null}

      <div className="post-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {isAuthed && (
          <button onClick={handleBookmarkToggle} disabled={busy}>
            {isBookmarked ? "Unsave" : "Save"}
          </button>
        )}
        {isAuthor && (
          <>
            <button onClick={() => onEdit(post)} disabled={busy}>
              Edit
            </button>
            <button onClick={() => onDelete(post._id)} disabled={busy}>
              Delete
            </button>
          </>
        )}
        <button onClick={() => onAnalytics(post)} disabled={busy}>
          Analytics
        </button>
      </div>
    </article>
  );
}
