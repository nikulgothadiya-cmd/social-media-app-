import { useEffect, useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";
import StoryViewer from "./StoryViewer.jsx";

export default function StoriesBar() {
  const [stories, setStories] = useState([]);
  const [viewingIndex, setViewingIndex] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/stories").then(({ data }) => {
      if (!active) return;
      setStories(data.stories || []);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!stories.length) return null;

  return (
    <div style={{ padding: "12px 8px 8px", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
