import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

const tones = [
  { id: "supportive", label: "Supportive", desc: "Warm, validating, and friendly." },
  { id: "professional", label: "Professional", desc: "Clear, structured, and direct." },
  { id: "playful", label: "Playful", desc: "Light, witty, and upbeat." },
];

const audiences = [
  { id: "public", label: "Public Reply", meta: "Visible to everyone" },
  { id: "followers", label: "Followers Only", meta: "Only your followers" },
  { id: "private", label: "Private Message", meta: "One-on-one" },
];

export default function CreateResponse() {
  const [tone, setTone] = useState("supportive");
  const [audience, setAudience] = useState("public");
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState([]);
  const [lastDraftId, setLastDraftId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const isAuthed = !!getToken();

  const selectedTone = useMemo(
    () => tones.find((item) => item.id === tone),
    [tone]
  );

  const loadRecent = async () => {
    const { data } = await api.get("/responses?status=sent&limit=3");
    setRecent(data.responses || []);
  };

  const loadLatestDraft = async () => {
    const { data } = await api.get("/responses?status=draft&limit=1");
    const draftItem = data.responses?.[0];
    if (!draftItem) return;
    setLastDraftId(draftItem._id);
    setTitle(draftItem.title || "");
    setDraft(draftItem.body || "");
    setTone(draftItem.tone || "supportive");
    setAudience(draftItem.audience || "public");
    setStatus("Draft restored");
  };

  const loadPrompt = async () => {
    const { data } = await api.get("/notifications");
    const latest = data.notifications?.[0];
    if (!latest) return;
    setPrompt(latest);
  };

  useEffect(() => {
    if (!isAuthed) return;
    loadRecent().catch(() => {});
    loadLatestDraft().catch(() => {});
    loadPrompt().catch(() => {});
  }, [isAuthed]);

  const handleSaveDraft = async () => {
    if (!isAuthed) {
      setError("Login to save a draft.");
      return;
    }
    setError("");
    setStatus("");
    setSaving(true);
    const payload = {
      title,
      body: draft,
      tone,
      audience,
      status: "draft",
      context: prompt?.post?.content || ""
    };
    try {
      const { data } = lastDraftId
        ? await api.put(`/responses/${lastDraftId}`, payload)
        : await api.post("/responses", payload);
      setLastDraftId(data.response?._id || lastDraftId);
      setStatus("Draft saved");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!isAuthed) {
      setError("Login to send a response.");
      return;
    }
    if (!draft.trim()) {
      setError("Response body is required to send.");
      return;
    }
    setError("");
    setStatus("");
    setSending(true);
    try {
      await api.post("/responses", {
        title,
        body: draft,
        tone,
        audience,
        status: "sent",
        context: prompt?.post?.content || ""
      });
      setShowConfirm(true);
      setTitle("");
      setDraft("");
      setLastDraftId(null);
      await loadRecent();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send response");
    } finally {
      setSending(false);
    }
  };

  const promptTitle = prompt?.actor?.username
    ? `@${prompt.actor.username}`
    : "A new comment";
  const promptText = prompt?.post?.content
    ? `"${prompt.post.content.slice(0, 120)}${prompt.post.content.length > 120 ? "..." : ""}"`
    : "“Share a helpful tip that keeps the thread moving.”";

  return (
    <section className="response-create">
      <div className="response-hero">
        <div className="response-hero-copy">
          <p className="response-eyebrow">Create Response</p>
          <h1>Shape the conversation with a clear, confident reply.</h1>
          <p className="muted">
            Pick a tone, set the audience, and draft something that feels
            intentional. Preview it, save it, and send when you are ready.
          </p>
          <div className="response-hero-actions">
            <button onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send Response"}
            </button>
            <button className="ghost" onClick={handleSaveDraft} disabled={saving}>
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
          {(status || error) && (
            <div className={`response-status ${error ? "error" : ""}`}>
              {error || status}
            </div>
          )}
        </div>
        <div className="response-hero-card">
          <div className="response-mini-header">
            <div className="avatar fallback">
              {prompt?.actor?.username?.[0]?.toUpperCase() || "AR"}
            </div>
            <div>
              <strong>{promptTitle}</strong>
              <p className="muted small">
                {prompt ? `Latest activity · ${prompt.type}` : "Latest activity"}
              </p>
            </div>
          </div>
          <p className="response-mini-text">{promptText}</p>
          <div className="response-mini-footer">
            <span className="response-pill accent">{isAuthed ? "Live" : "Login"}</span>
            <span className="response-pill">
              {prompt?.type ? prompt.type.replace("-", " ") : "Suggested"}
            </span>
          </div>
        </div>
        <div className="response-orbit response-orbit-one" />
        <div className="response-orbit response-orbit-two" />
      </div>

      <div className="response-layout">
        <div className="response-panel card">
          <h2 className="section-title">Draft your reply</h2>
          <label className="response-label">
            Response title
            <input
              placeholder="Short headline for your response"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="response-label">
            Response body
            <textarea
              rows={6}
              placeholder="Write something kind, helpful, and specific."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <div className="response-tools">
            <button className="ghost">Insert template</button>
            <button className="ghost">Add follow-up question</button>
            <button className="ghost">Attach link</button>
          </div>

          <div className="response-divider" />

          <h3 className="section-title">Tone</h3>
          <div className="response-grid">
            {tones.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`response-tone ${tone === item.id ? "active" : ""}`}
                onClick={() => setTone(item.id)}
              >
                <strong>{item.label}</strong>
                <span className="muted small">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="response-sidebar">
          <div className="card response-card">
            <h2 className="section-title">Audience</h2>
            <div className="response-grid">
              {audiences.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`response-tone ${audience === item.id ? "active" : ""}`}
                  onClick={() => setAudience(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span className="muted small">{item.meta}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card response-card">
            <h2 className="section-title">Preview</h2>
            <div className="response-preview">
              <div className="response-preview-header">
                <div className="avatar fallback">ME</div>
                <div>
                  <strong>You</strong>
                  <p className="muted small">Tone: {selectedTone?.label}</p>
                </div>
              </div>
              <p>
                {draft ||
                  "Thanks for sharing this. Staying consistent gets easier when you choose one small habit and protect it daily."}
              </p>
              <div className="response-mini-footer">
                <span className="response-pill">{audience.replace("-", " ")}</span>
                <span className="response-pill accent">Ready to send</span>
              </div>
            </div>
          </div>

          <div className="card response-card">
            <h2 className="section-title">Recent responses</h2>
            {recent.length ? (
              <div className="response-recent">
                {recent.map((item) => (
                  <div key={item._id} className="response-recent-item">
                    <strong>{item.title || "Untitled response"}</strong>
                    <p className="muted small">
                      {item.body?.slice(0, 80)}
                      {item.body?.length > 80 ? "..." : ""}
                    </p>
                    <div className="response-mini-footer">
                      <span className="response-pill">{item.tone}</span>
                      <span className="response-pill">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small">No responses yet.</p>
            )}
          </div>

          <div className="card response-card response-guidelines">
            <h2 className="section-title">Quick checklist</h2>
            <ul>
              <li>Open with appreciation</li>
              <li>Offer one concrete tip</li>
              <li>Invite a follow-up</li>
              <li>Keep it under 3 sentences</li>
            </ul>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal card" onClick={(event) => event.stopPropagation()}>
            <h2 className="section-title">Response sent</h2>
            <p className="muted">
              Your response is live and ready to keep the conversation moving.
            </p>
            <div className="response-confirm-actions">
              <button onClick={() => setShowConfirm(false)}>Close</button>
              <button className="ghost" onClick={() => setShowConfirm(false)}>
                Draft another
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
