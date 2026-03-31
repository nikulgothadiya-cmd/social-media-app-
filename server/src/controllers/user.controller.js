import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { emitToUser } from "../socket.js";

export async function getMe(req, res) {
  const user = await User.findById(req.user.id).select(
    "username email bio avatarUrl role isBanned verified"
  );
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user });
}

export async function updateMe(req, res) {
  const { bio, avatarUrl } = req.body || {};
  const updates = {};
  if (typeof bio === "string") {
    updates.bio = bio.trim();
  }
  if (typeof avatarUrl === "string") {
    updates.avatarUrl = avatarUrl.trim();
  }
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select(
    "username email bio avatarUrl role isBanned verified"
  );
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user });
}

export async function getProfile(req, res) {
  const { username } = req.params;
  const user = await User.findOne({ username }).select(
    "username bio avatarUrl followers following verified"
  );
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const viewerId = req.user?.id;
  const isFollowing = viewerId
    ? user.followers.some((id) => id.toString() === viewerId)
    : false;
  res.json({
    user: {
      id: user._id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      verified: user.verified,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing
    }
  });
}

export async function followUser(req, res) {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }
  const target = await User.findById(targetId);
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }
  const me = await User.findById(req.user.id);
  if (!me) {
    return res.status(404).json({ message: "User not found" });
  }
  const already = me.following.some((id) => id.toString() === targetId);
  if (!already) {
    me.following.push(target._id);
    target.followers.push(me._id);
    await Promise.all([me.save(), target.save()]);
    const notification = await Notification.create({
      user: target._id,
      actor: me._id,
      type: "follow",
      post: null
    });
    await notification.populate("actor", "username avatarUrl");
    emitToUser(target._id.toString(), "notification", { notification });
  }

  res.json({
    ok: true,
    followed: !already,
    user: {
      id: target._id,
      followersCount: target.followers.length,
      followingCount: target.following.length,
      isFollowing: true
    }
  });
}

export async function unfollowUser(req, res) {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ message: "You cannot unfollow yourself" });
  }
  const target = await User.findById(targetId);
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }
  const me = await User.findById(req.user.id);
  if (!me) {
    return res.status(404).json({ message: "User not found" });
  }
  const wasFollowing = me.following.some((id) => id.toString() === targetId);
  me.following = me.following.filter((id) => id.toString() !== targetId);
  target.followers = target.followers.filter((id) => id.toString() !== req.user.id);
  await Promise.all([me.save(), target.save()]);

  res.json({
    ok: true,
    unfollowed: wasFollowing,
    user: {
      id: target._id,
      followersCount: target.followers.length,
      followingCount: target.following.length,
      isFollowing: false
    }
  });
}

export async function getFollowers(req, res) {
  const key = req.params.username;
  const user = await User.findOne({ username: key }).populate({
    path: "followers",
    select: "username avatarUrl bio verified"
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const viewerId = req.user?.id;
  const viewer = viewerId ? await User.findById(viewerId).select("following") : null;

  const followers = user.followers.map((follower) => ({
    id: follower._id,
    username: follower.username,
    avatarUrl: follower.avatarUrl,
    bio: follower.bio,
    verified: follower.verified,
    isFollowing: !!viewer && viewer.following.some((id) => id.toString() === follower._id.toString())
  }));

  res.json({
    users: followers,
    count: followers.length
  });
}

export async function getFollowing(req, res) {
  const key = req.params.username;
  const user = await User.findOne({ username: key }).populate({
    path: "following",
    select: "username avatarUrl bio verified"
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const viewerId = req.user?.id;
  const viewer = viewerId ? await User.findById(viewerId).select("following") : null;

  const following = user.following.map((followingUser) => ({
    id: followingUser._id,
    username: followingUser.username,
    avatarUrl: followingUser.avatarUrl,
    bio: followingUser.bio,
    verified: followingUser.verified,
    isFollowing: !!viewer && viewer.following.some((id) => id.toString() === followingUser._id.toString())
  }));

  res.json({
    users: following,
    count: following.length
  });
}

export async function listBookmarks(req, res) {
  const user = await User.findById(req.user.id)
    .populate({
      path: "bookmarks",
      populate: { path: "author", select: "username avatarUrl verified" }
    })
    .select("bookmarks");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ posts: user.bookmarks || [] });
}

export async function addBookmark(req, res) {
  const { postId } = req.body || {};
  if (!postId) {
    return res.status(400).json({ message: "postId is required" });
  }
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const exists = user.bookmarks.some((id) => id.toString() === postId);
  if (!exists) {
    user.bookmarks.push(postId);
    await user.save();
  }
  res.json({ ok: true });
}

export async function removeBookmark(req, res) {
  const { postId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.bookmarks = user.bookmarks.filter((id) => id.toString() !== postId);
  await user.save();
  res.json({ ok: true });
}

export async function listSuggestedUsers(req, res) {
  const viewerId = req.user?.id;
  const pipeline = [];
  if (viewerId) {
    pipeline.push({ $match: { _id: { $ne: new mongoose.Types.ObjectId(viewerId) } } });
  }
  pipeline.push(
    {
      $project: {
        username: 1,
        avatarUrl: 1,
        bio: 1,
        verified: 1,
        followersCount: { $size: { $ifNull: ["$followers", []] } }
      }
    },
    { $sort: { followersCount: -1 } },
    { $limit: 10 }
  );
  const users = await User.aggregate(pipeline);
  res.json({ users });
}
