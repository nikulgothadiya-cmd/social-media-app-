import { useEffect, useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";
import { getToken } from "../api/token.js";
import StoryViewer from "../components/StoryViewer.jsx";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingIndex, setViewingIndex] = useState(null);
  const [creatingStory, setCreatingStory] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState("");
  const [storyText, setStoryText] = useState("");
  const [uploading, setUploading] = useState(false);
  const isAuthed = !!getToken();

  const loadStories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/stories");
      setStories(data.stories || []);
      
      if (isAuthed) {
        // Filter stories by current user to show their own stories
        const currentUserStories = (data.stories || []).filter(
          (story) => story.author?.username === localStorage.getItem("username")
        );
        setMyStories(currentUserStories);
      }
      setError("");
    } catch (err) {
      setError("Failed to load stories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
    const interval = setInterval(loadStories, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthed]);

  const handleStoryUpload = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    
    const form = new FormData();
    form.append("images", list[0]);
    setUploading(true);
    
    try {
      const { data } = await api.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (data.urls?.[0]) {
        setStoryImageUrl(normalizeMediaUrl(data.urls[0]));
      } else if (data.url) {
        setStoryImageUrl(normalizeMediaUrl(data.url));
      }
    } catch (err) {
      setError("Failed to upload image");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!storyImageUrl) {
      setError("Please upload an image");
      return;
    }

    try {
      await api.post("/stories", {
        imageUrl: storyImageUrl,
        text: storyText
      });
      setStoryImageUrl("");
      setStoryText("");
      setCreatingStory(false);
      setError("");
      await loadStories();
    } catch (err) {
      setError("Failed to create story");
      console.error(err);
    }
  };

  if (!isAuthed) {
    return (
      <section className="card">
        <h1>Stories</h1>
        <p className="muted">Login to view and create stories.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="card">
        <h1>Stories</h1>
        <p className="muted">Loading stories...</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Stories</h1>

      {error && <p className="error">{error}</p>}

      {/* Create Story Section */}
      {!creatingStory && (
        <div className="card story-create-prompt">
          <button
            className="story-create-btn"
            onClick={() => setCreatingStory(true)}
          >
            + Create Story
          </button>
          <p className="muted small">Stories expire after 24 hours</p>
        </div>
      )}

      {/* Create Story Form */}
      {creatingStory && (
        <div className="card story-create-form">
          <h2 className="section-title">Create a Story</h2>
          <form onSubmit={handleCreateStory}>
            <div className="story-form-group">
              <label htmlFor="story-image">Image</label>
              <input
                id="story-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleStoryUpload(e.target.files)}
              />
              {uploading && <p className="muted small">Uploading...</p>}
            </div>

            {storyImageUrl && (
              <div className="story-preview">
                <img src={normalizeMediaUrl(storyImageUrl)} alt="Story preview" />
              </div>
            )}

            <div className="story-form-group">
              <label htmlFor="story-text">Text (optional)</label>
              <textarea
                id="story-text"
                placeholder="Add text to your story..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                maxLength="200"
                rows="3"
              />
              <p className="muted small">{storyText.length}/200 characters</p>
            </div>

            <div className="story-form-actions">
              <button type="submit" disabled={!storyImageUrl || uploading}>
                {uploading ? "Uploading..." : "Post Story"}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setCreatingStory(false);
                  setStoryImageUrl("");
                  setStoryText("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Stories Section */}
      {myStories.length > 0 && (
        <div className="card">
          <h2 className="section-title">Your Stories</h2>
          <div className="stories-grid">
            {myStories.map((story, idx) => (
              <div
                key={story._id}
                className="story-thumbnail"
                onClick={() => setViewingIndex(idx)}
                role="button"
                tabIndex={0}
              >
                <img src={normalizeMediaUrl(story.imageUrl)} alt="Your story" />
                <div className="story-thumbnail-overlay">
                  <p className="muted small">
                    {new Date(story.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Stories Grid */}
      {stories.length > 0 ? (
        <div className="card">
          <h2 className="section-title">All Stories</h2>
          <p className="muted small">Tap to view, expires in 24 hours</p>
          <div className="stories-grid">
            {stories.map((story, idx) => {
              const timeLeft =
                story.expiresAt ?
                  Math.max(0, Math.floor((new Date(story.expiresAt) - new Date()) / 1000))
                  : null;
              const expiresIn =
                timeLeft > 3600
                  ? `${Math.floor(timeLeft / 3600)}h`
                  : timeLeft > 60
                  ? `${Math.floor(timeLeft / 60)}m`
                  : `${timeLeft}s`;

              return (
                <div
                  key={story._id}
                  className="story-thumbnail"
                  onClick={() => setViewingIndex(idx)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={normalizeMediaUrl(story.imageUrl)} alt={story.author?.username} />
                  <div className="story-thumbnail-overlay">
                    <div className="story-thumbnail-author">
                      <strong>@{story.author?.username || "user"}</strong>
                    </div>
                    <span className="story-expires-badge">{expiresIn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="muted">No stories yet. Be the first to create one!</p>
        </div>
      )}

      {/* Story Viewer Modal */}
      {viewingIndex !== null && stories[viewingIndex] && (
        <StoryViewer
          stories={stories.slice(viewingIndex)}
          initialIndex={0}
          onClose={() => setViewingIndex(null)}
        />
      )}
    </section>
  );
}
