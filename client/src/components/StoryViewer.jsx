import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { normalizeMediaUrl } from "../api/client.js";

export default function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((idx) => {
      if (idx + 1 < stories.length) return idx + 1;
      onClose?.();
      return idx;
    });
  }, [stories.length, onClose]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : idx));
  }, []);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / 3000; // 3 seconds per story
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex, handleNext]);

  if (!currentStory) return null;

  const timeLeft = currentStory.expiresAt
    ? Math.max(0, Math.floor((new Date(currentStory.expiresAt) - new Date()) / 1000))
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="story-viewer"
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", overflow: "hidden" }}
      >
        {/* Progress bar - white timeline at top */}
        <div
          className="story-progress-container"
          style={{
            position: "absolute",
            top: "10px",
            left: "12px",
            right: "12px",
            display: "flex",
            gap: "6px",
            pointerEvents: "none"
          }}
        >
          {stories.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: "4px",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "999px",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`,
                  background: "#fff",
                  transition: "width 50ms linear"
                }}
              />
            </div>
          ))}
        </div>

        {/* Image + tap zones */}
        <div style={{ position: "relative" }}>
          <img
            src={normalizeMediaUrl(currentStory.imageUrl)}
            alt={currentStory.author?.username}
            className="story-viewer-image"
          />
          <button
            type="button"
            aria-label="Previous story"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "40%",
              background: "transparent",
              border: "none",
              cursor: currentIndex === 0 ? "default" : "pointer"
            }}
          />
          <button
            type="button"
            aria-label="Next story"
            onClick={handleNext}
            disabled={currentIndex === stories.length - 1}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "40%",
              background: "transparent",
              border: "none",
              cursor: currentIndex === stories.length - 1 ? "default" : "pointer"
            }}
          />
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-author">
            {currentStory.author?.avatarUrl ? (
              <img
                src={normalizeMediaUrl(currentStory.author.avatarUrl)}
                alt={currentStory.author.username}
                className="avatar small"
              />
            ) : (
              <div className="avatar small fallback">
                {currentStory.author?.username?.[0] || "U"}
              </div>
            )}
            <Link to={`/u/${currentStory.author?.username}`} className="story-author-link">
              <strong>@{currentStory.author?.username || "user"}</strong>
            </Link>
          </div>
          {timeLeft !== null && (
            <span className="story-expires">
              {timeLeft > 3600
                ? `${Math.floor(timeLeft / 3600)}h left`
                : timeLeft > 60
                ? `${Math.floor(timeLeft / 60)}m left`
                : `${timeLeft}s left`}
            </span>
          )}
        </div>

        {/* Text overlay */}
        {currentStory.text && (
          <div className="story-viewer-text">
            <p>{currentStory.text}</p>
          </div>
        )}

        {/* Footer nav */}
        <div className="story-viewer-actions">
          <button
            className="story-nav-btn prev"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous story"
          >
            ← Prev
          </button>
          <div className="story-counter">
            {currentIndex + 1}/{stories.length}
          </div>
          <button
            className="story-nav-btn next"
            onClick={handleNext}
            disabled={currentIndex === stories.length - 1}
            aria-label="Next story"
          >
            Next →
          </button>
        </div>

        {/* Close */}
        <button className="story-close-btn" onClick={onClose} aria-label="Close story viewer">
          ✕
        </button>
      </div>
    </div>
  );
}
