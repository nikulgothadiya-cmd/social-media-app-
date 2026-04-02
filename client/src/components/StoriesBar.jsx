import { useEffect, useRef, useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";
import StoryViewer from "./StoryViewer.jsx";
import { getToken } from "../api/token.js";

export default function StoriesBar() {
  const [stories, setStories] = useState([]);
  const [viewingIndex, setViewingIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isAuthed = !!getToken();

  const loadStories = async () => {
    let data;
    try {
      ({ data } = await api.get("/stories"));
      setStories(data?.stories || []);
    } catch (err) {
      console.error("Failed to load stories", err);
    }
    return data;
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleAddStoryClick = () => {
    if (!isAuthed) return;
    fileInputRef.current?.click();
  };

  const handleStoryUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("images", file);
      const { data } = await api.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const imageUrl = normalizeMediaUrl(data.urls?.[0] || data.url);
      const text = window.prompt("Add a caption to your story? (optional)") || "";
      await api.post("/stories", { imageUrl, text });
      await loadStories();
    } catch (err) {
      console.error("Failed to create story", err);
      alert("Could not add story. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!stories.length && !isAuthed) return null;

  return (
    <div style={{ padding: "12px 8px 8px", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {isAuthed && (
          <button
            onClick={handleAddStoryClick}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "inherit",
              cursor: "pointer",
              textAlign: "center",
              width: "70px",
              flexShrink: 0,
              position: "relative"
            }}
            aria-label="Add story"
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px dashed #ff4d67",
                margin: "0 auto 6px",
                background: "#111",
                display: "grid",
                placeItems: "center",
                color: "#ff4d67",
                fontSize: "28px",
                fontWeight: "700"
              }}
            >
              {uploading ? "..." : "+"}
            </div>
            <span style={{ display: "block", fontSize: "12px" }}>Your story</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleStoryUpload(e.target.files?.[0])}
            />
          </button>
        )}
        {stories.map((story, idx) => (
          <button
            key={story._id}
            onClick={() => setViewingIndex(idx)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "inherit",
              cursor: "pointer",
              textAlign: "center",
              width: "70px",
              flexShrink: 0
            }}
            aria-label={`Story by ${story.author?.username || "user"}`}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #ff4d67",
                margin: "0 auto 6px",
                background: "#111"
              }}
            >
              <img
                src={normalizeMediaUrl(story.imageUrl)}
                alt={story.author?.username}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <span style={{ display: "block", fontSize: "12px" }}>
              @{story.author?.username || "user"}
            </span>
          </button>
        ))}
      </div>

      {viewingIndex !== null && stories[viewingIndex] && (
        <StoryViewer
          stories={stories}
          initialIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
        />
      )}
    </div>
  );
}
