import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAuthed = !!getToken();

  useEffect(() => {
    if (!isAuthed) {
      navigate("/login");
      return;
    }

    const loadUser = async () => {
      try {
        const { data } = await api.get("/users/me");
        setUser(data.user);
        setBio(data.user.bio || "");
        setAvatarUrl(data.user.avatarUrl || "");
      } catch (err) {
        setError("Failed to load profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [isAuthed, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.put("/users/me", {
        bio,
        avatarUrl
      });
      setUser(data.user);
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        navigate(`/u/${data.user.username}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthed) {
    return null;
  }

  if (loading) {
    return (
      <section className="card">
        <h1>Edit Profile</h1>
        <p className="muted">Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="card">
        <h1>Edit Profile</h1>
        <p className="error">User not found</p>
      </section>
    );
  }

  return (
    <section className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1>Edit Profile</h1>

      {error && <p className="error">{error}</p>}
      {success && <p className="muted" style={{ color: "#22c55e" }}>{success}</p>}

      <form onSubmit={handleSave} className="edit-form">
        <div>
          <h3>Username</h3>
          <p className="muted">@{user.username}</p>
        </div>

        <div>
          <h3>Email</h3>
          <p className="muted">{user.email}</p>
        </div>

        <div>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows="4"
            maxLength="160"
          />
          <p className="muted small">{bio.length}/160</p>
        </div>

        <div>
          <label htmlFor="avatarUrl">Avatar URL</label>
          <input
            id="avatarUrl"
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
          {avatarUrl && (
            <div style={{ marginTop: "12px" }}>
              <p className="muted">Preview:</p>
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="avatar large"
                style={{ width: "72px", height: "72px" }}
              />
            </div>
          )}
        </div>

        <div className="edit-actions" style={{ gap: "12px", marginTop: "20px" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
