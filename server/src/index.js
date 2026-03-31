import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import storyRoutes from "./routes/story.routes.js";
import searchRoutes from "./routes/search.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import responseRoutes from "./routes/response.routes.js";
import { Message } from "./models/Message.js";
import { roomIdForUsers } from "./controllers/chat.controller.js";
import { addOnlineUser, getOnlineUserIds, removeOnlineUser, setIo } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }
});
setIo(io);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Social Media API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/responses", responseRoutes);

const PORT = process.env.PORT || 5000;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Missing token"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.sub;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  if (!userId) return;

  addOnlineUser(userId, socket.id);
  io.emit("presence:update", { userId, online: true });
  socket.emit("presence:list", { users: getOnlineUserIds() });

  socket.join("global");

  socket.on("dm:join", (payload) => {
    const otherId = payload?.userId;
    if (!otherId) return;
    const roomId = roomIdForUsers(userId, otherId);
    socket.join(roomId);
    socket.emit("dm:joined", { roomId });
  });

  socket.on("typing", (payload) => {
    const isTyping = !!payload?.isTyping;
    let roomId = payload?.roomId || null;
    const recipientId = payload?.recipientId || null;
    if (recipientId) {
      roomId = roomIdForUsers(userId, recipientId);
    }
    if (!roomId) return;
    socket.to(roomId).emit("typing", { roomId, userId, isTyping });
  });

  socket.on("message", async (payload) => {
    const content = (payload?.content || "").trim();
    if (!content) return;
    let roomId = payload?.roomId || "global";
    let recipient = payload?.recipientId || null;
    if (recipient) {
      roomId = roomIdForUsers(userId, recipient);
    } else {
      recipient = null;
      roomId = "global";
    }
    const message = await Message.create({
      roomId,
      sender: userId,
      recipient,
      content,
      readBy: [userId],
      reactions: []
    });
    await message.populate("sender", "username avatarUrl");
    io.to(roomId).emit("message", { message });
  });

  socket.on("dm:read", async (payload) => {
    const otherId = payload?.userId;
    if (!otherId) return;
    const roomId = roomIdForUsers(userId, otherId);
    await Message.updateMany(
      { roomId, recipient: userId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    io.to(roomId).emit("dm:read", { roomId, userId });
  });

  socket.on("message:react", async (payload) => {
    const messageId = payload?.messageId;
    const emoji = (payload?.emoji || "").trim();
    if (!messageId || !emoji) return;
    const message = await Message.findById(messageId);
    if (!message) return;
    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === userId && r.emoji === emoji
    );
    if (existingIdx >= 0) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ user: userId, emoji });
    }
    await message.save();
    io.to(message.roomId).emit("message:react", { messageId, reactions: message.reactions });
  });

  socket.on("disconnect", () => {
    const wentOffline = removeOnlineUser(userId, socket.id);
    if (wentOffline) {
      io.emit("presence:update", { userId, online: false });
    }
  });
});

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
