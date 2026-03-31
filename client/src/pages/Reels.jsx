import { useEffect, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const isAuthed = !!getToken();

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
      const serverBase = api.defaults.baseURL?.replace("/api", "") || "http://localhost:5000";
      setVideoUrl(`${serverBase}${data.url}`);
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

  return (
    <section>
      <h1>Reels</h1>

      {isAuthed && (
        <form className="card" onSubmit={handleCreate}>
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

      <div className="reels-list">
        {reels.map((reel) => (
          <div key={reel._id} className="reel-card">
            <video className="reel-video" src={reel.videoUrl} controls loop />
            <div className="reel-meta">
              <strong>@{reel.author?.username || "user"}</strong>
              {reel.content && <p className="muted small">{reel.content}</p>}
            </div>
          </div>
        ))}
      </div>

      <button
        className="load-more"
        onClick={() => {
          const next = page + 1;
          setPage(next);
          load(next);
        }}
      >
        Load more
      </button>
    </section>
  );
}
