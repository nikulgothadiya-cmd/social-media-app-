import { useEffect, useState } from "react";
import api, { normalizeMediaUrl } from "../api/client.js";
import { Link } from "react-router-dom";

export default function Explore() {
  const [trending, setTrending] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/posts/tags/trending?limit=10").then(({ data }) => setTrending(data.tags || []));
    api.get("/users/suggested").then(({ data }) => setSuggested(data.users || []));
    api.get("/posts?page=1&limit=18").then(({ data }) => setPosts(data.posts || []));
  }, []);

  return (
    <section>
      <h1>Explore</h1>
      <div className="card">
        <h2 className="section-title">Trending Tags</h2>
        <div className="trending">
          {trending.length ? (
            trending.map((item) => (
              <span key={item.tag} className="tag-chip">
                #{item.tag} <span className="muted small">({item.count})</span>
              </span>
            ))
          ) : (
            <p className="muted">No trending tags yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Suggested Users</h2>
        {suggested.length ? (
          suggested.map((user) => (
            <div key={user._id} className="search-item">
              <Link to={`/u/${user.username}`}>
                @{user.username}
                {user.verified && <span className="badge-verified">✓</span>}
              </Link>
              <span className="muted small">{user.bio}</span>
              <span className="muted small">{user.followersCount} followers</span>
            </div>
          ))
        ) : (
          <p className="muted">No suggestions yet.</p>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Explore Grid</h2>
        <div className="explore-grid">
          {posts.map((post) => (
            <div key={post._id} className="explore-item">
              {post.videoUrl ? (
                <video src={normalizeMediaUrl(post.videoUrl)} muted />
              ) : post.images?.length ? (
                <img src={normalizeMediaUrl(post.images[0])} alt="Post" />
              ) : post.imageUrl ? (
                <img src={normalizeMediaUrl(post.imageUrl)} alt="Post" />
              ) : (
                <div className="explore-text">{post.content?.slice(0, 60)}</div>
              )}
            </div>
          ))}
        </div>
        <button
          className="load-more"
          onClick={() => {
            const next = page + 1;
            setPage(next);
            api.get(`/posts?page=${next}&limit=18`).then(({ data }) =>
              setPosts((prev) => [...prev, ...(data.posts || [])])
            );
          }}
        >
          Load more
        </button>
      </div>
    </section>
  );
}
