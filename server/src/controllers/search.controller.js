import { User } from "../models/User.js";
import { Post } from "../models/Post.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchAll(req, res) {
  const query = (req.query.q || "").trim();
  if (!query) {
    return res.json({ users: [], posts: [] });
  }
  const safe = escapeRegex(query);
  const regex = new RegExp(safe, "i");
  const [users, posts] = await Promise.all([
    User.find({ username: regex }).select("username avatarUrl bio verified").limit(10),
    Post.find({ content: regex })
      .populate("author", "username avatarUrl")
      .sort({ createdAt: -1 })
      .limit(10)
  ]);
  res.json({ users, posts });
}
