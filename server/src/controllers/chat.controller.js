import { User } from "../models/User.js";
import { Message } from "../models/Message.js";

function getRoomIdForUsers(userA, userB) {
  const [a, b] = [userA, userB].sort();
  return `dm:${a}:${b}`;
}

export async function listUsers(req, res) {
  const users = await User.find({ _id: { $ne: req.user.id } })
    .select("username avatarUrl bio verified")
    .sort({ username: 1 })
    .limit(100);
  res.json({ users });
}

export async function listMessages(req, res) {
  const { roomId, recipientId } = req.query;
  let resolvedRoom = roomId;
  if (!resolvedRoom) {
    if (recipientId) {
      resolvedRoom = getRoomIdForUsers(req.user.id, recipientId);
    } else {
      resolvedRoom = "global";
    }
  }
  const messages = await Message.find({ roomId: resolvedRoom })
    .populate("sender", "username avatarUrl")
    .sort({ createdAt: 1 })
    .limit(200);
  res.json({ roomId: resolvedRoom, messages });
}

export function roomIdForUsers(userA, userB) {
  return getRoomIdForUsers(userA, userB);
}
