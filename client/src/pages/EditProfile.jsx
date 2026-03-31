import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

export default function EditProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bio: "",
    avatarUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isAuthed = !!getToken();

  useEffect(() => {
    const loadMe = async () => {
      try {
        const { data } = await api.get("/users/me");
        setForm({
          bio: data?.user?.bio || "",
          avatarUrl: data?.user?.avatarUrl || ""
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Could not load your profile.");
      }
    };

    if (isAuthed) {
      loadMe();
    } else {
      setError("Please log in to edit your profile.");
    }
  }, [isAuthed]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthed) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.patch("/users/me", {
        bio: form.bio,
        avatarUrl: form.avatarUrl
      });
      setSuccess("Profile updated!");
      setTimeout(() => navigate(-1), 800);
    } catch (err) {
      console.error("Update failed", err);
      setError("Could not update profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h1>Edit Profile</h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="form" style={{ display: "grid", gap: "12px" }}>
        <label className="field">
          <span className="muted">Avatar URL</span>
          <input
            type="url"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
          />
        </label>
        <label className="field">
          <span className="muted">Bio</span>
          <textarea
            name="bio"
            rows="4"
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell people about yourself"
          />
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => navigate(-1)} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
