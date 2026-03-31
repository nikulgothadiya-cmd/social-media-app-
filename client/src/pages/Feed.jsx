import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { normalizeMediaUrl } from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Feed({ onAuthChange }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [me, setMe] = useState(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [trending, setTrending] = useState([]);
  const [stories, setStories] = useState([]);
  const [storyImageUrl, setStoryImageUrl] = useState("");
  const [storyText, setStoryText] = useState("");
  const isAuthed = !!getToken();
  const draftKey = "post_draft_v1";
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const [imageIndex, setImageIndex] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [historyId, setHistoryId] = useState(null);
  const [analyticsPost, setAnalyticsPost] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);

  const loadPosts = async (tag) => {
    const url = tag ? `/posts?tag=${encodeURIComponent(tag)}` : "/posts";
    const { data } = await api.get(url);
    setPosts(data.posts || []);
  };

  const loadTrending = async () => {
    const { data } = await api.get("/posts/tags/trending?limit=8");
    setTrending(data.tags || []);
  };

  const loadStories = async () => {
    const { data } = await api.get("/stories");
    setStories(data.stories || []);
  };

  const loadBookmarks = async () => {
    if (!isAuthed) return;
    const { data } = await api.get("/users/me/bookmarks");
    const ids = new Set((data.posts || []).map((p) => p._id));
    setBookmarkIds(ids);
  };

  const loadMe = async () => {
    const { data } = await api.get("/users/me");
    setMe(data.user);
    setBio(data.user?.bio || "");
    setAvatarUrl(data.user?.avatarUrl || "");
  };

  useEffect(() => {
    loadPosts();
    loadTrending();
    loadStories();
    if (isAuthed) loadBookmarks();
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setContent(parsed.content || "");
        setImageUrl(parsed.imageUrl || "");
        setImageUrls(parsed.imageUrls || []);
      } catch {
        // ignore invalid draft
      }
    }
  }, []);

  useEffect(() => {
    if (!posts.length) return;
    const key = "viewed_posts_v1";
    const stored = localStorage.getItem(key);
    const viewed = new Set(stored ? JSON.parse(stored) : []);
    const toView = posts.filter((p) => !viewed.has(p._id)).slice(0, 10);
    toView.forEach((post) => {
      api.post(`/posts/${post._id}/view`).catch(() => {});
      viewed.add(post._id);
    });
    localStorage.setItem(key, JSON.stringify(Array.from(viewed)));
  }, [posts]);

  useEffect(() => {
    if (isAuthed) {
      loadMe();
    } else {
      setMe(null);
    }
  }, [isAuthed]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const draft = JSON.stringify({ content, imageUrl, imageUrls });
      localStorage.setItem(draftKey, draft);
    }, 300);
    return () => clearTimeout(timeout);
  }, [content, imageUrl, imageUrls]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim() && imageUrls.length === 0) return;
    await api.post("/posts", {
      content,
      imageUrl,
      imageUrls
    });
    setContent("");
    setImageUrl("");
    setImageUrls([]);
    localStorage.removeItem(draftKey);
    await Promise.all([loadPosts(tagFilter), loadTrending()]);
    onAuthChange?.(true);
  };

  const handleLike = async (id) => {
    await api.post(`/posts/${id}/like`);
    await loadPosts(tagFilter);
  };

  const handleBookmark = async (id) => {
    if (bookmarkIds.has(id)) {
      await api.delete(`/users/me/bookmarks/${id}`);
    } else {
      await api.post("/users/me/bookmarks", { postId: id });
    }
    await loadBookmarks();
  };

  const handleCommentChange = (id, value) => {
    setCommentDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddComment = async (e, id) => {
    e.preventDefault();
    const text = (commentDrafts[id] || "").trim();
    if (!text) return;
    await api.post(`/posts/${id}/comments`, { text });
    setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
    await loadPosts(tagFilter);
  };

  const handleDelete = async (id) => {
    await api.delete(`/posts/${id}`);
    await Promise.all([loadPosts(tagFilter), loadTrending()]);
  };

  const startEdit = (post) => {
    setEditingId(post._id);
    setEditContent(post.content || "");
    setEditImageUrl(post.imageUrl || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditImageUrl("");
  };

  const saveEdit = async (post) => {
    const payload = { content: editContent };
    if (!post.images?.length) {
      payload.imageUrl = editImageUrl;
    }
    await api.put(`/posts/${post._id}`, payload);
    cancelEdit();
    await loadPosts(tagFilter);
  };

  const openAnalytics = async (post) => {
    setAnalyticsPost(post);
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get(`/posts/${post._id}/analytics`);
      setAnalyticsData(data);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileStatus("");
    await api.put("/users/me", { bio, avatarUrl });
    setProfileStatus("Profile saved");
    await loadMe();
  };

  const handleStoryUpload = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    const form = new FormData();
    form.append("images", list[0]);
    const { data } = await api.post("/uploads", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    if (data.urls?.[0]) {
      setStoryImageUrl(normalizeMediaUrl(data.urls[0]));
    } else if (data.url) {
      setStoryImageUrl(normalizeMediaUrl(data.url));
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!storyImageUrl) return;
    await api.post("/stories", { imageUrl: storyImageUrl, text: storyText });
    setStoryImageUrl("");
    setStoryText("");
    await loadStories();
  };

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const timer = setInterval(() => {
      setActiveStoryIndex((prev) => {
        if (prev === null) return null;
        if (prev + 1 >= stories.length) return null;
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [activeStoryIndex, stories.length]);

  const handleUpload = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    const form = new FormData();
    list.forEach((file) => form.append("images", file));
    setUploading(true);
    try {
      const { data } = await api.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (data.urls) {
        setImageUrls(data.urls.map((url) => normalizeMediaUrl(url)));
        setImageUrl("");
      } else if (data.url) {
        setImageUrl(normalizeMediaUrl(data.url));
        setImageUrls([]);
      }
    } finally {
      setUploading(false);
    }
  };

  const isAuthor = (post) => {
    const authorId = post.author?._id || post.author;
    const myId = me?._id || me?.id;
    return !!authorId && !!myId && authorId.toString() === myId.toString();
  };

  return (
    <section>
      <h1>Feed</h1>

      <div className="card">
        <h2 className="section-title">Stories</h2>
        {isAuthed && (
          <form className="story-form" onSubmit={handleCreateStory}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleStoryUpload(e.target.files)}
            />
            <input
              placeholder="Short story text (optional)"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
            />
            <button type="submit" disabled={!storyImageUrl}>
              Post story
            </button>
          </form>
        )}
        <div className="story-list">
          {stories.length ? (
            stories.map((story, idx) => (
              <div
                key={story._id}
                className="story-card"
                onClick={() => setActiveStoryIndex(idx)}
                role="button"
                tabIndex={0}
              >
                <img src={story.imageUrl} alt={story.author?.username} />
                <div className="story-meta">
                  <strong>
                    @{story.author?.username || "user"}
                    {story.author?.verified && <span className="badge-verified">✓</span>}
                  </strong>
                  {story.text && <span className="muted small">{story.text}</span>}
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No stories yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Discover</h2>
        <form
          className="tag-search"
          onSubmit={(e) => {
            e.preventDefault();
            const cleaned = tagFilter.replace(/^#/, "").trim().toLowerCase();
            setTagFilter(cleaned);
            loadPosts(cleaned);
          }}
        >
          <input
            placeholder="Search by hashtag, e.g. #travel"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
          <button type="submit">Search</button>
          {tagFilter && (
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setTagFilter("");
                loadPosts("");
              }}
            >
              Clear
            </button>
          )}
        </form>
        <div className="trending">
          {trending.length ? (
            trending.map((item) => (
              <button
                key={item.tag}
                className="tag-chip"
                onClick={() => {
                  setTagFilter(item.tag);
                  loadPosts(item.tag);
                }}
              >
                #{item.tag} <span className="muted small">({item.count})</span>
              </button>
            ))
          ) : (
            <p className="muted">No trending tags yet.</p>
          )}
        </div>
      </div>

      {isAuthed && (
        <form className="card" onSubmit={handleProfileSave}>
          <h2 className="section-title">Your Profile</h2>
          <label>
            Bio
            <textarea
              placeholder="Tell people about you..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
            />
          </label>
          <label>
            Avatar URL
            <input
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </label>
          <button type="submit">Save profile</button>
          {profileStatus && <p className="muted">{profileStatus}</p>}
        </form>
      )}

      {isAuthed ? (
        <form className="card" onSubmit={handleCreate}>
          <h2 className="section-title">Create Post</h2>
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="upload-row">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
            />
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
          <div className="draft-actions">
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setContent("");
                setImageUrl("");
                setImageUrls([]);
                localStorage.removeItem(draftKey);
              }}
            >
              Clear draft
            </button>
          </div>
          <button type="submit">Post</button>
        </form>
      ) : (
        <p className="muted">Login to create posts.</p>
      )}

      <div className="list">
        {posts.map((post) => (
          <article key={post._id} className="card">
            <div className="post-header">
              <div className="post-author">
                {post.author?.avatarUrl ? (
                  <img className="avatar" src={post.author.avatarUrl} alt={post.author.username} />
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
                {isAuthed && isAuthor(post) && (
                  <div className="post-owner-actions">
                    <button className="linklike" onClick={() => openAnalytics(post)}>
                      Stats
                    </button>
                    <button className="linklike" onClick={() => startEdit(post)}>
                      Edit
                    </button>
                    <button className="linklike danger" onClick={() => handleDelete(post._id)}>
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
                  <button type="button" onClick={() => saveEdit(post)}>
                    Save
                  </button>
                  <button type="button" className="linklike" onClick={cancelEdit}>
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
                    onClick={() => {
                      setTagFilter(tag);
                      loadPosts(tag);
                    }}
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
                src={normalizeMediaUrl(post.images[imageIndex[post._id] || 0])}
                alt="Post"
              />
              {post.images.length > 1 && (
                  <div className="carousel-controls">
                    <button
                      type="button"
                      onClick={() =>
                        setImageIndex((prev) => ({
                          ...prev,
                          [post._id]:
                            (prev[post._id] || 0) === 0
                              ? post.images.length - 1
                              : (prev[post._id] || 0) - 1
                        }))
                      }
                    >
                      Prev
                    </button>
                    <span className="muted small">
                      {(imageIndex[post._id] || 0) + 1}/{post.images.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setImageIndex((prev) => ({
                          ...prev,
                          [post._id]: ((prev[post._id] || 0) + 1) % post.images.length
                        }))
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              post.imageUrl && (
                <img
                  className="post-image"
                  src={normalizeMediaUrl(post.imageUrl)}
                  alt="Post"
                />
              )
            )}
            {post.videoUrl && (
              <video className="post-video" src={normalizeMediaUrl(post.videoUrl)} controls loop />
            )}
            <div className="post-actions">
              <button onClick={() => handleLike(post._id)} disabled={!isAuthed}>
                Like ({post.likes?.length || 0})
              </button>
              <button onClick={() => handleBookmark(post._id)} disabled={!isAuthed}>
                {bookmarkIds.has(post._id) ? "Saved" : "Save"}
              </button>
              <span className="muted small">{post.comments?.length || 0} comments</span>
            </div>
            <div className="comments">
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
                <form className="comment-form" onSubmit={(e) => handleAddComment(e, post._id)}>
                  <input
                    placeholder="Write a comment..."
                    value={commentDrafts[post._id] || ""}
                    onChange={(e) => handleCommentChange(post._id, e.target.value)}
                  />
                  <button type="submit">Comment</button>
                </form>
              ) : (
                <p className="muted small">Login to comment.</p>
              )}
            </div>
          </article>
        ))}
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

      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="modal-overlay" onClick={() => setActiveStoryIndex(null)}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <img
              src={normalizeMediaUrl(stories[activeStoryIndex].imageUrl)}
              alt={stories[activeStoryIndex].author?.username}
            />
            <div className="story-viewer-meta">
              <strong>@{stories[activeStoryIndex].author?.username || "user"}</strong>
              {stories[activeStoryIndex].text && (
                <span className="muted small">{stories[activeStoryIndex].text}</span>
              )}
            </div>
            <div className="story-viewer-controls">
              <button
                type="button"
                onClick={() =>
                  setActiveStoryIndex((prev) => (prev > 0 ? prev - 1 : prev))
                }
              >
                Prev
              </button>
              <button type="button" onClick={() => setActiveStoryIndex(null)}>
                Close
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStoryIndex((prev) =>
                    prev + 1 < stories.length ? prev + 1 : null
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
