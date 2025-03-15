const express = require("express");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
dotenv.config();
const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json({ limit: "10MB" }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("create-room", (roomId, callback) => {
    if (rooms.has(roomId)) {
      callback({ success: false });
      return;
    }
    rooms.set(roomId, {
      users: new Set([roomId]),
      offerer: roomId,
    });
    socket.join(roomId);
    callback({ success: true });
    console.log(`Room created: ${roomId}`);
  });

  socket.on("join-room", ({ username, roomId }, callback) => {
    const room = rooms.get(roomId);
    if (!room || room.users.size >= 2) {
      callback({ success: false });
      return;
    }
    room.users.add(username);
    socket.join(roomId);
    io.to(roomId).emit("room-updated", {
      users: Array.from(room.users),
      offerer: room.offerer,
    });
    callback({ success: true, users: Array.from(room.users) });
    console.log(`User ${username} joined room ${roomId}`);
  });

  socket.on("offer", (data) => {
    const { offer, username } = data;
    socket.to(data.roomId).emit("offer", { offer, username });
    console.log(`Offer received from ${username}`);
  });

  socket.on("answer", (data) => {
    const { answer, username } = data;
    socket.to(data.roomId).emit("answer", { answer, username });
    console.log(`Answer received from ${username}`);
  });

  socket.on("ice-candidate", (data) => {
    const { candidate, username, roomId } = data;
    socket.to(roomId).emit("ice-candidate", { candidate, username });
    console.log(`ICE candidate received from ${username}`);
  });

  socket.on("leave-room", ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.users.delete(username);
      io.to(roomId).emit("user-left", username);
      console.log(`User ${username} left room ${roomId}`);
      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
