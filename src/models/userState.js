import mongoose from 'mongoose';

const userStateSchema = new mongoose.Schema(
  {
    online: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
    socketId: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('UserState', userStateSchema);
