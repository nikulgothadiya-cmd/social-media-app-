import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client.js";
import { getToken } from "../api/token.js";

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [listType, setListType] = useState(null); // "followers" or "following"
  const [listUsers, setListUsers] = useState([]);
  const isAuthed = !!getToken();

  const loadProfile = async () => {
    const { data } = await api.get(`/users/${username}`);
    setProfile(data.user);
  };

  const loadPosts = async () => {
    const { data } = await api.get(`/posts?author=${username}`);
    setPosts(data.posts || []);
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
    const { data } = await api.get("/users/me");
    setMe(data.user);
  };

  useEffect(() => {
    setError("");
    setListType(null);
    setListUsers([]);
    Promise.all([loadProfile(), loadPosts()]).catch(() => {
      setError("Profile not found");
    });
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
    return <p className="muted">Loading profile...</p>;
  }

  return (
    <section>
      <div className="card profile-card">
        <div className="profile-header">
          {profile.avatarUrl ? (
            <img className="avatar large" src={profile.avatarUrl} alt={profile.username} />
          ) : (
            <div className="avatar large fallback">{profile.username?.[0] || "U"}</div>
          )}
          <div>
            <h1>
              @{profile.username}
              {profile.verified && <span className="badge-verified">✓</span>}
            </h1>
            <p className="muted">{profile.bio || "No bio yet."}</p>
            <div className="profile-stats">
              <button className="link-btn" onClick={() => loadUserList("followers")}> 
                {profile.followersCount} followers
              </button>
              <button className="link-btn" onClick={() => loadUserList("following")}> 
                {profile.followingCount} following
              </button>
            </div>
          </div>
        </div>

        {isAuthed && !isMe && (
          <button className="follow-btn" onClick={handleFollow} disabled={followLoading}>
            {followLoading ? "Working..." : profile.isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      {listType && (
        <div className="card">
          <h2 className="section-title">{listType === "followers" ? "Followers" : "Following"}</h2>
          {listUsers.length ? (
            <ul className="user-list">
              {listUsers.map((user) => (
                <li key={user.id} className="user-list-item">
                  <Link to={`/profile/${user.username}`}>
                    {user.avatarUrl ? (
                      <img className="avatar small" src={user.avatarUrl} alt={user.username} />
                    ) : (
                      <div className="avatar small fallback">{user.username?.[0] || "U"}</div>
                    )}
                    <span>@{user.username}</span>
                  </Link>
                  {user.isFollowing && <span className="badge">Following</span>}
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
        {posts.length ? (
          posts.map((post) => (
            <article key={post._id} className="card post-compact">
              <div className="post-header">
                <strong>@{post.author?.username || "user"}</strong>
                <span className="muted">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p>{post.content}</p>
              {post.videoUrl && <video className="post-video" src={post.videoUrl} controls loop />}
              {post.images?.length ? (
                <img className="post-image" src={post.images[0]} alt="Post" />
              ) : (
                post.imageUrl && <img className="post-image" src={post.imageUrl} alt="Post" />
              )}
            </article>
          ))
        ) : (
          <p className="muted">No posts yet.</p>
        )}
      </div>
    </section>
  );
}
