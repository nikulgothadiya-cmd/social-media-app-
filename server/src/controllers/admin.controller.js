import { User } from "../models/User.js";
import { Post } from "../models/Post.js";

export async function listUsers(req, res) {
  const users = await User.find()
    .select("username email role isBanned verified createdAt")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ users });
}

export async function toggleBan(req, res) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ ok: true, isBanned: user.isBanned });
}

export async function toggleVerified(req, res) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.verified = !user.verified;
  await user.save();
  res.json({ ok: true, verified: user.verified });
}

export async function listPosts(req, res) {
  const posts = await Post.find()
    .populate("author", "username avatarUrl")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ posts });
}

export async function deletePostAdmin(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  await post.deleteOne();
  res.json({ ok: true });
}
