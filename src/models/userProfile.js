import mongoose, { Schema } from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dateOfBirth: {
      type: Date,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    location: {
      type: String,
    },
    bio: {
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

const autoPopulateFollowersAndFollowing = function (next) {
  this.populate('followers following');
  next();
};

userProfileSchema
  .pre('findOne', autoPopulateFollowersAndFollowing)
  .pre('find', autoPopulateFollowersAndFollowing);

module.exports = mongoose.model('UserProfile', userProfileSchema);
