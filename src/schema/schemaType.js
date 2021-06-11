import * as graphql from 'graphql';

import User from '../models/user';
import UserProfile from '../models/userProfile';
import ProfileImage from '../models/profileImages';
import Post from '../models/post';
import Comment from '../models/comment';
import Like from '../models/like';
import UserState from '../models/userState';
import Group from '../models/group';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
} = graphql;

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    fullname: { type: GraphQLString },
    email: { type: GraphQLString },
    username: { type: GraphQLString },
    password: { type: GraphQLString },
    token: { type: GraphQLString },
    userProfile: {
      type: UserProfileType,
      resolve(parent, args) {
        return UserProfile.findOne({ user: parent.id });
      },
    },
  }),
});

const UserStateType = new GraphQLObjectType({
  name: 'UserState',
  fields: () => ({
    id: { type: GraphQLID },
    online: { type: GraphQLString },
    lastSeen: { type: GraphQLString },
    socketId: { type: GraphQLString },
    user: {
      type: UserType,
      resolve(parent, args) {
        const user = User.findById(parent.user);
        return user;
      },
    },
  }),
});

const UserProfileType = new GraphQLObjectType({
  name: 'UserProfile',
  fields: () => ({
    id: { type: GraphQLID },
    user: {
      type: UserType,
      resolve(parent, args) {
        const user = User.findById(parent.user);
        return user;
      },
    },
    dateOfBirth: { type: GraphQLString },
    followers: {
      type: new GraphQLList(UserType),
    },
    following: {
      type: new GraphQLList(UserType),
    },
    location: { type: GraphQLString },
    bio: { type: GraphQLString },
    userProfileImages: {
      type: ProfileImageType,
      resolve: async (parent, args) => {
        const profileImages = await ProfileImage.findOne({
          userProfile: parent.id,
        });
        return profileImages;
      },
    },
  }),
});

const ProfileImageType = new GraphQLObjectType({
  name: 'ProfileImage',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    url: { type: GraphQLString },
    userProfile: {
      type: UserProfileType,
      resolve(parent, args) {
        // DB
        const profile = UserProfile.find({
          id: parent.userProfile,
        });
        return profile;
      },
    },
  }),
});

const CommentType = new GraphQLObjectType({
  name: 'Comment',
  fields: () => ({
    id: { type: GraphQLID },
    created_at: { type: GraphQLString },
    postId: {
      type: PostType,
      resolve(parent, args) {
        return Post.findById(parent.postId);
      },
    },
    userId: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.userId);
      },
    },

    comment: { type: GraphQLString },
    likes: {
      type: GraphQLInt,
    },
  }),
});

const LikeType = new GraphQLObjectType({
  name: 'Like',
  fields: () => ({
    id: { type: GraphQLID },
    postId: {
      type: PostType,
      resolve(parent, args) {
        return Post.findById(parent.postId);
      },
    },
    userId: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.userId);
      },
    },
  }),
});
const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    caption: { type: GraphQLString },
    postUrl: { type: GraphQLString },
    location: { type: GraphQLString },
    created_at: { type: GraphQLString },
    user: {
      type: UserType,
      resolve(parent, args) {
        const user = User.findById(parent.user);
        return user;
      },
    },

    mentions: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return User.find({
          _id: {
            $in: parent.mentions,
          },
        });
      },
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve(parent, args) {
        return Comment.find({
          postId: parent.id,
        });
      },
    },
    likes: {
      type: new GraphQLList(LikeType),
      resolve(parent, args) {
        return Like.find({
          postId: parent.id,
        });
      },
    },
  }),
});

const GroupType = new GraphQLObjectType({
  name: 'Group',
  fields: () => ({
    id: {
      type: GraphQLID,
    },
    created_at: {
      type: GraphQLString,
    },
    groupType: {
      type: GraphQLString,
    },
    backgroundImage: {
      type: GraphQLString,
    },
    chatRoom: {
      type: GraphQLString,
    },
    members: {
      type: new GraphQLList(UserType),
      resolve: (parent, args) => {
        return User.find({
          _id: {
            $in: parent.members,
          },
        });
      },
    },
  }),
});

const ConversationType = new GraphQLObjectType({
  name: 'Conversation',
  fields: () => ({
    id: { type: GraphQLID },
    created_at: { type: GraphQLString },
    groupId: {
      type: GroupType,
      resolve(parent, args) {
        return Group.findById(parent.groupId);
      },
    },
    senderId: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.senderId);
      },
    },

    message: { type: GraphQLString },
    seen: {
      type: GraphQLBoolean,
    },
    reaction: {
      type: new GraphQLList(GraphQLString),
    },
  }),
});

export {
  UserType,
  UserStateType,
  UserProfileType,
  ProfileImageType,
  PostType,
  LikeType,
  CommentType,
  GroupType,
  ConversationType,
};
