// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  senderId: {
    type: String, // UUID as string
    required: true
  },
  receiverId: {
    type: String, // UUID as string
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('Chat', chatSchema);
