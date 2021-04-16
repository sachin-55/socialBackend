import mongoose, { Schema } from 'mongoose';

const profileImages = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    url: {
      type: String,
    },
    userProfile: {
      type: Schema.Types.ObjectId,
      ref: 'UserProfile',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('ProfileImage', profileImages);
