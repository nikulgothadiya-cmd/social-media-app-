import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api, { normalizeMediaUrl } from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [listType, setListType] = useState(null); // "followers" or "following"
  const [listUsers, setListUsers] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const isAuthed = !!getToken();

  const loadProfile = async () => {
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.user);
    } catch (err) {
      setError("Profile not found");
      console.error(err);
    }
  };

  const loadPosts = async () => {
    setPostsLoading(true);
    setPostsError("");
    try {
      const { data } = await api.get(`/posts?author=${username}`);
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to load posts", err);
      setPostsError("Couldn't load posts for this user.");
    } finally {
      setPostsLoading(false);
    }
  };

  const loadUserList = async (type) => {
    if (!profile) return;
    try {
      const { data } = await api.get(`/users/${profile.username}/${type}`);
      setListUsers(data.users || []);
      setListType(type);
    } catch (err) {
      console.error(`Failed to load ${type}`, err);
      setError(`Could not load ${type}`);
    }
  };

  const loadMe = async () => {
    try {
      const { data } = await api.get("/users/me");
      setMe(data.user);
    } catch (err) {
      console.error("Failed to load current user", err);
    }
  };

  useEffect(() => {
    setError("");
    setListType(null);
    setListUsers([]);
    loadProfile();
    loadPosts();
  }, [username]);

  useEffect(() => {
    if (isAuthed) {
      loadMe();
    } else {
      setMe(null);
    }
  }, [isAuthed]);

  const isMe = profile && me && (profile.id === me._id || profile.id === me.id);

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    const originalProfile = profile;

    setFollowLoading(true);
    setProfile((prev) => {
      if (!prev) return prev;
      const isFollowingNow = !prev.isFollowing;
      return {
        ...prev,
        isFollowing: isFollowingNow,
        followersCount: Math.max(0, prev.followersCount + (isFollowingNow ? 1 : -1))
      };
    });

    try {
      if (originalProfile.isFollowing) {
        await api.delete(`/users/${profile.id}/follow`);
      } else {
        await api.post(`/users/${profile.id}/follow`);
      }
      await loadProfile();
    } catch (err) {
      console.error("Follow/unfollow error", err);
      setError("Unable to update follow status. Please try again.");
      setProfile(originalProfile);
    } finally {
      setFollowLoading(false);
    }
  };

  const closeUserList = () => {
    setListType(null);
    setListUsers([]);
  };

  if (!isAuthed) {
    return (
      <section className="card">
        <h1>Profile</h1>
        <p className="muted">Login to view profile details.</p>
        <Link to="/login">Go to login</Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h1>Profile</h1>
        <p className="error">{error}</p>
        <Link to="/">Back to feed</Link>
      </section>
    );
  }

  if (!profile) {
    return (
      <div className="card">
        <h1>Profile</h1>
        <p className="muted">Loading profile...</p>
      </div>
    );
  }

  return (
    <section>
      <div className="card profile-card">
        <div className="profile-header">
          {profile.avatarUrl ? (
            <img
              className="avatar large"
              src={normalizeMediaUrl(profile.avatarUrl)}
              alt={profile.username}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="avatar large fallback">
              {profile.username?.[0] || "U"}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ margin: "0 0 4px 0" }}>
                @{profile.username}
              </h1>
              {profile.verified && (
                <span className="badge-verified">&#10003;</span>
              )}
            </div>
            <p className="muted" style={{ marginBottom: "12px" }}>
              {profile.bio || "No bio yet."}
            </p>
            <div className="profile-stats">
              <button
                className="link-btn"
                onClick={() => loadUserList("followers")}
                style={{
                  background: "none",
                  color: "inherit",
                  border: "none",
                  padding: "0",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                <strong>{profile.followersCount}</strong> followers
              </button>
              <button
                className="link-btn"
                onClick={() => loadUserList("following")}
                style={{
                  background: "none",
                  color: "inherit",
                  border: "none",
                  padding: "0",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                <strong>{profile.followingCount}</strong> following
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {isAuthed && !isMe && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  background: profile.isFollowing ? "transparent" : "var(--accent)",
                  color: profile.isFollowing ? "var(--accent)" : "white",
                  border: profile.isFollowing ? "2px solid var(--accent)" : "none"
                }}
              >
                {followLoading
                  ? "..."
                  : profile.isFollowing
                    ? "Unfollow"
                    : "Follow"}
              </button>
            )}
            {isMe && (
              <button onClick={() => navigate("/edit-profile")}>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {listType && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="section-title">
              {listType === "followers" ? "Followers" : "Following"}
            </h2>
            <button
              className="linklike"
              onClick={closeUserList}
              style={{ padding: "6px 12px" }}
              aria-label="Close list"
            >
              &#10005;
            </button>
          </div>
          {listUsers.length ? (
            <ul className="user-list">
              {listUsers.map((user) => (
                <li key={user.id} className="user-list-item">
                  <Link to={`/u/${user.username}`}>
                    {user.avatarUrl ? (
                      <img
                        className="avatar small"
                        src={normalizeMediaUrl(user.avatarUrl)}
                        alt={user.username}
                      />
                    ) : (
                      <div className="avatar small fallback">
                        {user.username?.[0] || "U"}
                      </div>
                    )}
                    <span>@{user.username}</span>
                  </Link>
                  {user.isFollowing && (
                    <span
                      className="badge"
                      style={{
                        background: "#e0e7ff",
                        color: "#1d4ed8",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "12px"
                      }}
                    >
                      Following
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No {listType} yet.</p>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Posts</h2>
        {postsLoading ? (
          <p className="muted">Loading posts...</p>
        ) : postsError ? (
          <p className="error">{postsError}</p>
        ) : posts.length ? (
          posts.map((post) => (
            <article key={post._id} className="card post-compact">
              <div className="post-header">
                <strong>@{post.author?.username || "user"}</strong>
                <span className="muted">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <p>{post.content}</p>
              {post.videoUrl && (
                <video
                  className="post-video"
                  src={normalizeMediaUrl(post.videoUrl)}
                  controls
                  loop
                />
              )}
              {post.images?.length ? (
                <img className="post-image" src={normalizeMediaUrl(post.images[0])} alt="Post" />
              ) : post.imageUrl ? (
                <img className="post-image" src={normalizeMediaUrl(post.imageUrl)} alt="Post" />
              ) : null}
            </article>
          ))
        ) : (
          <p className="muted">No posts yet.</p>
        )}
      </div>
    </section>
  );
}
