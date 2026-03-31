import { Story } from "../models/Story.js";

export async function listStories(req, res) {
  const now = new Date();
  const stories = await Story.find({ expiresAt: { $gt: now } })
    .populate("author", "username avatarUrl")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ stories });
}

export async function createStory(req, res) {
  const { imageUrl, text } = req.body || {};
  const normalizedImage = (imageUrl || "").trim();
  const normalizedText = (text || "").trim();
  if (!normalizedImage) {
    return res.status(400).json({ message: "imageUrl is required" });
  }
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const story = await Story.create({
    author: req.user.id,
    imageUrl: normalizedImage,
    text: normalizedText,
    expiresAt
  });
  await story.populate("author", "username avatarUrl");
  res.status(201).json({ story });
}
