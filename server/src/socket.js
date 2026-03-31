let ioInstance = null;
const onlineUsers = new Map();

export function setIo(io) {
  ioInstance = io;
}

export function addOnlineUser(userId, socketId) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
}

export function removeOnlineUser(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.forEach((id) => ioInstance.to(id).emit(event, payload));
}
