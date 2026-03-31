import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { emitToUser } from "../socket.js";
import { PostView } from "../models/PostView.js";
import { LikeEvent } from "../models/LikeEvent.js";

function extractTags(content) {
  if (!content) return [];
  const matches = content.match(/#[\p{L}\p{N}_]+/gu) || [];
  return Array.from(
    new Set(
      matches.map((tag) => tag.slice(1).toLowerCase()).filter((tag) => tag.length > 0)
    )
  );
}

export async function listPosts(req, res) {
  const { author, authorId, tag, page, limit, reelsOnly } = req.query;
  let filter = {};
  if (authorId) {
    filter = { author: authorId };
  } else if (author) {
    const user = await User.findOne({ username: author }).select("_id");
    if (!user) {
      return res.json({ posts: [] });
    }
    filter = { author: user._id };
  } else if (tag) {
    filter = { tags: tag.toLowerCase() };
  }
  if (reelsOnly === "true") {
    filter = { ...filter, isReel: true };
  }
  const pageNum = Math.max(parseInt(page || "1", 10), 1);
  const limitNum = Math.min(parseInt(limit || "20", 10), 50);
  const skip = (pageNum - 1) * limitNum;
  const posts = await Post.find(filter)
    .populate("author", "username avatarUrl verified")
    .populate("comments.user", "username avatarUrl verified")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  res.json({ posts });
}

export async function listReels(req, res) {
  const { page, limit } = req.query;
  const pageNum = Math.max(parseInt(page || "1", 10), 1);
  const limitNum = Math.min(parseInt(limit || "10", 10), 30);
  const skip = (pageNum - 1) * limitNum;
  const posts = await Post.find({ isReel: true })
    .populate("author", "username avatarUrl verified")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  res.json({ posts });
}

export async function createPost(req, res) {
  const { content, imageUrl, imageUrls, videoUrl, isReel } = req.body || {};
  const normalizedContent = (content || "").trim();
  const normalizedImage = (imageUrl || "").trim();
  const normalizedVideo = (videoUrl || "").trim();
  const tags = extractTags(normalizedContent);
  let images = [];
  if (Array.isArray(imageUrls)) {
    images = imageUrls.map((url) => (url || "").trim()).filter(Boolean);
  } else if (normalizedImage) {
    images = [normalizedImage];
  }
  if (!normalizedContent && images.length === 0 && !normalizedVideo) {
    return res.status(400).json({ message: "content or imageUrl is required" });
  }
  const post = await Post.create({
    author: req.user.id,
    content: normalizedContent,
    imageUrl: normalizedImage,
    images,
    videoUrl: normalizedVideo,
    isReel: !!isReel || !!normalizedVideo,
    tags
  });
  await post.populate("author", "username avatarUrl verified");
  res.status(201).json({ post });
}

export async function toggleLike(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  const userId = req.user.id;
  const idx = post.likes.findIndex((id) => id.toString() === userId);
  if (idx >= 0) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(userId);
    await LikeEvent.create({ post: post._id, user: userId });
    if (post.author.toString() !== userId) {
      const notification = await Notification.create({
        user: post.author,
        actor: userId,
        type: "like",
        post: post._id
      });
      await notification.populate("actor", "username avatarUrl");
      await notification.populate("post", "content");
      emitToUser(post.author.toString(), "notification", { notification });
    }
  }
  await post.save();
  res.json({ likes: post.likes.length });
}

export async function addComment(req, res) {
  const { text } = req.body || {};
  const normalizedText = (text || "").trim();
  if (!normalizedText) {
    return res.status(400).json({ message: "text is required" });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  post.comments.push({ user: req.user.id, text: normalizedText });
  if (post.author.toString() !== req.user.id) {
    const notification = await Notification.create({
      user: post.author,
      actor: req.user.id,
      type: "comment",
      post: post._id
    });
    await notification.populate("actor", "username avatarUrl");
    await notification.populate("post", "content");
    emitToUser(post.author.toString(), "notification", { notification });
  }
  await post.save();
  await post.populate("comments.user", "username avatarUrl verified");
  res.status(201).json({ comments: post.comments });
}

export async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed to delete this post" });
  }
  await post.deleteOne();
  res.json({ ok: true });
}

export async function viewPost(req, res) {
  const post = await Post.findById(req.params.id).select("_id");
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });
  await PostView.create({ post: post._id, user: req.user?.id || null });
  res.json({ ok: true });
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getPostAnalytics(req, res) {
  const post = await Post.findById(req.params.id).select("author views likes");
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }
  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const viewsByDay = await PostView.aggregate([
    { $match: { post: post._id, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const likesByDay = await LikeEvent.aggregate([
    { $match: { post: post._id, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    views: post.views || 0,
    likes: post.likes?.length || 0,
    viewsByDay,
    likesByDay
  });
}

export async function updatePost(req, res) {
  const { content, imageUrl, imageUrls } = req.body || {};
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed to edit this post" });
  }

  const updates = {};
  if (typeof content === "string") {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      return res.status(400).json({ message: "content cannot be empty" });
    }
    updates.content = normalizedContent;
    updates.tags = extractTags(normalizedContent);
  }
  if (Array.isArray(imageUrls)) {
    updates.images = imageUrls.map((url) => (url || "").trim()).filter(Boolean);
  } else if (typeof imageUrl === "string") {
    updates.imageUrl = imageUrl.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No updates provided" });
  }

  post.edits.push({
    content: post.content,
    imageUrl: post.imageUrl,
    images: post.images
  });
  Object.assign(post, updates);
  post.editedAt = new Date();
  await post.save();
  await post.populate("author", "username avatarUrl");
  res.json({ post });
}

export async function listTrendingTags(req, res) {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const results = await Post.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  res.json({ tags: results.map((t) => ({ tag: t._id, count: t.count })) });
}
