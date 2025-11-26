// socket/index.js
import { Server } from "socket.io";
import Message from "./../modules/chat/chat.model.js"; // create this model

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const users = new Map(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("register", (userId) => {
      users.set(userId, socket.id);
      socket.broadcast.emit("online", userId);
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocket = users.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit("typing", senderId);
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      const receiverSocket = users.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit("stopTyping", senderId);
    });

    socket.on("sendMessage", async ({ sender, receiver, message, type }) => {
      const saved = await Message.create({ sender, receiver, message, type });

      const receiverSocket = users.get(receiver);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", saved);
        saved.status = "delivered";
        saved.save();
      }
    });

    socket.on("seen", async ({ messageId, userId }) => {
      await Message.findByIdAndUpdate(messageId, { status: "seen" });
      const senderSocket = users.get(userId);
      if (senderSocket) io.to(senderSocket).emit("seen", messageId);
    });

    socket.on("uploadFile", async ({ sender, receiver, fileUrl }) => {
      const saved = await Message.create({ sender, receiver, message: fileUrl, type: "file" });
      const receiverSocket = users.get(receiver);
      if (receiverSocket) io.to(receiverSocket).emit("receiveMessage", saved);
    });

    socket.on("call", ({ caller, receiver, callType }) => {
      const receiverSocket = users.get(receiver);
      if (receiverSocket) io.to(receiverSocket).emit("incomingCall", { caller, callType });
    });

    socket.on("missedCall", ({ caller, receiver }) => {
      const receiverSocket = users.get(receiver);
      if (receiverSocket) io.to(receiverSocket).emit("missedCall", caller);
    });

    socket.on("disconnect", () => {
      for (const [userId, id] of users.entries()) {
        if (id === socket.id) {
          users.delete(userId);
          socket.broadcast.emit("offline", userId);
          break;
        }
      }
    });
  });

  return io;
};
