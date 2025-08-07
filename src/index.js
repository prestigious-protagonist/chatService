// src/index.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { clerkMiddleware } = require('@clerk/express');
const { Server } = require('socket.io');
const Chat = require('./model/chatSchema');
const cors = require('cors');
const authValidator = require('./middleware/authValidator');
require('dotenv').config();


const crypto = require('crypto');
global.crypto = crypto;


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(clerkMiddleware());
app.use(cors());
app.use(express.json());
app.get('/chatService', (req, res)=> res.send('Hitting the Chat Service'))

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.post('/chatService/chat', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    const newChat = new Chat({ senderId, receiverId, message });
    await newChat.save();

    // Emit message to receiver in real time
    io.to(receiverId).emit('new_message', newChat);

    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get('/chatService/chat/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const chats = await Chat.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Socket.IO Connection
io.on('connection', socket => {
  socket.on('join', userId => {
    socket.join(userId);
  });

  socket.on('send_message', async data => {
    const { senderId, receiverId, message } = data;

    const newChat = new Chat({ senderId, receiverId, message });
    await newChat.save();

    io.to(receiverId).emit('new_message', newChat);
  });

  socket.on('disconnect', () => {
    // handle disconnection if needed
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});
