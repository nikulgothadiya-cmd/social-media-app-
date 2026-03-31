import { Notification } from "../models/Notification.js";

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ user: req.user.id })
    .populate("actor", "username avatarUrl")
    .populate("post", "content")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
}

export async function markRead(req, res) {
  const { id } = req.params;
  await Notification.updateOne({ _id: id, user: req.user.id }, { $set: { read: true } });
  res.json({ ok: true });
}
