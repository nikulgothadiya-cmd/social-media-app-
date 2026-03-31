import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / 3000); // 3 seconds per story
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex + 1 < stories.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose?.();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentStory) {
    return null;
  }

  const timeLeft = currentStory.expiresAt 
    ? Math.max(0, Math.floor((new Date(currentStory.expiresAt) - new Date()) / 1000))
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
        {/* Progress bar */}
        <div className="story-progress-container">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="story-progress-bar"
              style={{
                opacity: idx < currentIndex ? 1 : idx === currentIndex ? 1 : 0.3,
                width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`
              }}
            />
          ))}
        </div>

        {/* Story image */}
        <img
          src={currentStory.imageUrl}
          alt={currentStory.author?.username}
          className="story-viewer-image"
        />

        {/* Header with author info */}
        <div className="story-viewer-header">
          <div className="story-viewer-author">
            {currentStory.author?.avatarUrl ? (
              <img
                src={currentStory.author.avatarUrl}
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

        {/* Story text overlay */}
        {currentStory.text && (
          <div className="story-viewer-text">
            <p>{currentStory.text}</p>
          </div>
        )}

        {/* Navigation actions */}
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

        {/* Close button */}
        <button
          className="story-close-btn"
          onClick={onClose}
          aria-label="Close story viewer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
