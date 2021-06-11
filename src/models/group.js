import mongoose, { Schema } from 'mongoose';

const group = new mongoose.Schema(
  {
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupType: {
      type: String,
      enum: ['Duo', 'Multiple'],
      default: 'Duo',
    },
    backgroundImage: {
      type: String,
    },
    chatRoom: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('Group', group);
