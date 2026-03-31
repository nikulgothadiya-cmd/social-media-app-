import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";

export default function PostItem({
  post,
  isAuthed,
  isAuthor,
  onDelete,
  onEdit,
  onAnalytics,
  bookmarkIds = new Set(),
  onBookmarkChange,
  tagFilter,
  onTagClick
}) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState(post.content || "");
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || "");
  const [historyId, setHistoryId] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expanded, setExpanded] = useState(false);

  const handleStartEdit = () => {
    setEditingId(post._id);
    setEditContent(post.content || "");
    setEditImageUrl(post.imageUrl || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditImageUrl("");
  };

  const handleSaveEdit = async () => {
    const payload = { content: editContent };
    if (!post.images?.length) {
      payload.imageUrl = editImageUrl;
    }
    await api.put(`/posts/${post._id}`, payload);
    handleCancelEdit();
    onEdit?.();
  };

  const handleLike = async () => {
    await api.post(`/posts/${post._id}/like`);
    onEdit?.();
  };

  const handleBookmark = async () => {
    if (bookmarkIds.has(post._id)) {
      await api.delete(`/users/me/bookmarks/${post._id}`);
    } else {
      await api.post("/users/me/bookmarks", { postId: post._id });
    }
    onBookmarkChange?.();
  };

  const handleCommentChange = (value) => {
    setCommentDrafts((prev) => ({ ...prev, [post._id]: value }));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = (commentDrafts[post._id] || "").trim();
    if (!text) return;
    await api.post(`/posts/${post._id}/comments`, { text });
    setCommentDrafts((prev) => ({ ...prev, [post._id]: "" }));
    onEdit?.();
  };

  return (
    <article className="card">
      <div className="post-header">
        <div className="post-author">
          {post.author?.avatarUrl ? (
            <img
              className="avatar"
              src={post.author.avatarUrl}
              alt={post.author.username}
            />
          ) : (
            <div className="avatar fallback">{post.author?.username?.[0] || "U"}</div>
          )}
          {post.author?.username ? (
            <Link to={`/u/${post.author.username}`} className="user-link">
              <strong>
                @{post.author.username}
                {post.author?.verified && <span className="badge-verified">✓</span>}
              </strong>
            </Link>
          ) : (
            <strong>@user</strong>
          )}
        </div>
        <div className="post-meta">
          <span className="muted">{new Date(post.createdAt).toLocaleString()}</span>
          {isAuthed && isAuthor && (
            <div className="post-owner-actions">
              <button className="linklike" onClick={() => onAnalytics?.(post)}>
                Stats
              </button>
              <button className="linklike" onClick={handleStartEdit}>
                Edit
              </button>
              <button
                className="linklike danger"
                onClick={() => onDelete?.(post._id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {editingId === post._id ? (
        <div className="edit-form">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
          {!post.images?.length && (
            <input
              placeholder="Image URL (optional)"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
            />
          )}
          <div className="edit-actions">
            <button type="button" onClick={handleSaveEdit}>
              Save
            </button>
            <button type="button" className="linklike" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>{post.content}</p>
          {post.editedAt && (
            <button
              type="button"
              className="linklike"
              onClick={() => setHistoryId(historyId === post._id ? null : post._id)}
            >
              Edited
            </button>
          )}
        </>
      )}

      {historyId === post._id && post.edits?.length ? (
        <div className="edit-history">
          {post.edits.map((edit, idx) => (
            <div key={`${post._id}-edit-${idx}`} className="edit-history-item">
              <span className="muted small">
                {new Date(edit.editedAt).toLocaleString()}
              </span>
              <p>{edit.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      {post.tags?.length ? (
        <div className="tag-list">
          {post.tags.map((tag) => (
            <button
              key={tag}
              className="tag-chip"
              onClick={() => onTagClick?.(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      ) : null}

      {post.images?.length ? (
        <div className="carousel">
          <img
            className="post-image"
            src={post.images[imageIndex]}
            alt="Post"
          />
          {post.images.length > 1 && (
            <div className="carousel-controls">
              <button
                type="button"
                onClick={() =>
                  setImageIndex(imageIndex === 0 ? post.images.length - 1 : imageIndex - 1)
                }
              >
                Prev
              </button>
              <span className="muted small">
                {imageIndex + 1}/{post.images.length}
              </span>
              <button
                type="button"
                onClick={() => setImageIndex((imageIndex + 1) % post.images.length)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : post.imageUrl ? (
        <img className="post-image" src={post.imageUrl} alt="Post" />
      ) : null}

      {post.videoUrl && (
        <video className="post-video" src={post.videoUrl} controls loop />
      )}

      <div className="post-actions">
        <button onClick={handleLike} disabled={!isAuthed}>
          {post.likes?.some((like) => like === post._id) ? "Liked" : "Like"} (
          {post.likes?.length || 0})
        </button>
        <button onClick={handleBookmark} disabled={!isAuthed}>
          {bookmarkIds.has(post._id) ? "Saved" : "Save"}
        </button>
        <span className="muted small">{post.comments?.length || 0} comments</span>
      </div>

      <div className="comments">
        {expanded ? (
          <>
            {post.comments?.length ? (
              post.comments.map((comment) => (
                <div key={comment._id} className="comment">
                  <strong>
                    @{comment.user?.username || "user"}
                    {comment.user?.verified && <span className="badge-verified">✓</span>}
                  </strong>
                  <span className="muted small">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                  <p>{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="muted small">No comments yet.</p>
            )}
            {isAuthed ? (
              <form className="comment-form" onSubmit={handleAddComment}>
                <input
                  placeholder="Write a comment..."
                  value={commentDrafts[post._id] || ""}
                  onChange={(e) => handleCommentChange(e.target.value)}
                />
                <button type="submit">Comment</button>
              </form>
            ) : (
              <p className="muted small">Login to comment.</p>
            )}
            <button
              className="linklike"
              onClick={() => setExpanded(false)}
              style={{ marginTop: "8px" }}
            >
              Hide comments
            </button>
          </>
        ) : (
          post.comments?.length > 0 && (
            <button
              className="linklike"
              onClick={() => setExpanded(true)}
            >
              Show {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}
            </button>
          )
        )}
      </div>
    </article>
  );
}
