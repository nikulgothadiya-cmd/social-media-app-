import { useEffect, useRef, useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef([]);
  const isAuthed = !!getToken();
  const stackHeight = "100dvh"; // full mobile viewport height (accounts for URL bars)

  const load = async (pageNum = 1) => {
    const { data } = await api.get(`/posts/reels?page=${pageNum}&limit=10`);
    if (pageNum === 1) setReels(data.posts || []);
    else setReels((prev) => [...prev, ...(data.posts || [])]);
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleVideoUpload = async (file) => {
    if (!file) return;
    const form = new FormData();
    form.append("video", file);
    setUploading(true);
    try {
      const { data } = await api.post("/uploads/video", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setVideoUrl(normalizeMediaUrl(data.url));
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!videoUrl) return;
    await api.post("/posts", { content: caption, videoUrl, isReel: true });
    setVideoUrl("");
    setCaption("");
    await load(1);
  };

  // Autoplay the reel mostly in view (Instagram-like)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.index);
          const vid = videoRefs.current[idx];
          if (!vid) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.65) {
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        });
      },
      { threshold: [0.65] }
    );

    videoRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [reels]);

  const togglePlay = (idx) => {
    const vid = videoRefs.current[idx];
    if (!vid) return;
    if (vid.paused) vid.play();
    else vid.pause();
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0"
      }}
    >
      <h1 style={{ padding: "12px 16px 0", margin: 0 }}>Reels</h1>

      <div
        className="reels-stack"
        style={{
          scrollSnapType: "y mandatory",
          overflowY: "auto",
          height: stackHeight,
          borderRadius: "18px",
          margin: "0",
          padding: "12px 0 80px", // leave space for bottom nav
          overscrollBehaviorY: "contain"
        }}
      >
        {reels.map((reel, idx) => (
          <div
            key={reel._id}
            className="reel-card"
            style={{
              position: "relative",
              height: "100%",
              scrollSnapAlign: "start",
              marginBottom: "12px",
              overflow: "hidden",
              borderRadius: "18px",
              background: "#000"
            }}
          >
            <video
              ref={(el) => (videoRefs.current[idx] = el)}
              data-index={idx}
              className="reel-video"
              src={normalizeMediaUrl(reel.videoUrl)}
              muted={muted}
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
              onClick={() => togglePlay(idx)}
            />

            {/* Overlay UI */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                right: "16px",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "12px",
                pointerEvents: "none"
              }}
            >
              <div style={{ pointerEvents: "auto" }}>
                <strong>@{reel.author?.username || "user"}</strong>
                {reel.content && <p style={{ margin: "4px 0 0", color: "#e5e5e5" }}>{reel.content}</p>}
              </div>
            </div>

            {/* actions anchored bottom-right */}
            <div
              className="reel-actions"
              style={{
                position: "absolute",
                right: "12px",
                bottom: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                pointerEvents: "auto"
              }}
            >
              <button
                type="button"
                style={{ background: "rgba(0,0,0,0.35)", color: "white", border: "none", padding: "10px", borderRadius: "50%" }}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <span className="muted small" style={{ color: "#e5e5e5" }}>
                {reel.likes?.length || 0} likes
              </span>
            </div>
          </div>
        ))}
      </div>

      {isAuthed && (
        <form className="card" onSubmit={handleCreate} style={{ margin: "12px 16px 16px" }}>
          <h2 className="section-title">Create Reel</h2>
          <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files?.[0])} />
          {uploading && <p className="muted">Uploading...</p>}
          <input
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {videoUrl && <video className="reel-video" src={videoUrl} controls />}
          <button type="submit" disabled={!videoUrl}>
            Post Reel
          </button>
        </form>
      )}

      <button
        className="load-more"
        onClick={() => {
          const next = page + 1;
          setPage(next);
          load(next);
        }}
        style={{ margin: "0 16px 16px" }}
      >
        Load more
      </button>

    </section>
  );
}
