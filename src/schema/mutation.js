import * as graphql from 'graphql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import User from '../models/user';
import UserProfile from '../models/userProfile';
import ProfileImage from '../models/profileImages';
import Post from '../models/post';
import Comment from '../models/comment';
import Like from '../models/like';
import UserState from '../models/userState';
import Group from '../models/group';

import {
  UserType,
  UserProfileType,
  ProfileImageType,
  PostType,
  LikeType,
  CommentType,
  GroupType,
} from './schemaType';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} = graphql;

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    signup: {
      type: UserType,
      args: {
        fullname: { type: new GraphQLNonNull(GraphQLString) },
        username: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const passwordHashed = await bcrypt.hash(args.password, 12);
        const user = new User({
          fullname: args.fullname,
          username: args.username,
          email: args.email,
          password: passwordHashed,
        });
        await user.save();
        const token = await jwt.sign({ ...user }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });

        const userState = new UserState({
          user: user.id,
          lastSeen: Date.now(),
        });
        await userState.save();

        const userProfile = new UserProfile({
          user: user.id,
        });

        userProfile.save();

        return {
          token,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          id: user.id,
        };
      },
    },
    login: {
      type: UserType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        if (!args.email || !args.password) {
          throw new Error('Email/Password are empty!!!');
        }
        const user = await User.findOne({
          email: args.email,
        }).select('+password');

        if (!user) {
          throw new Error('User does not exist');
        }
        const passwordMatched = await bcrypt.compare(
          args.password,
          user.password
        );

        if (!passwordMatched) {
          throw new Error('Incorrect email or password');
        }

        const token = await jwt.sign({ ...user }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return {
          token,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          id: user.id,
        };
      },
    },
    addUserProfile: {
      type: UserProfileType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLID) },
        dateOfBirth: { type: new GraphQLNonNull(GraphQLString) },
        followers: {
          type: new GraphQLList(GraphQLID),
        },
        following: {
          type: new GraphQLList(GraphQLID),
        },
        location: { type: new GraphQLNonNull(GraphQLString) },
        bio: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parent, args) {
        const userProfile = new UserProfile({
          user: args.userId,
          dateOfBirth: args.dateOfBirth,
          followers: args.followers,
          following: args.following,
          location: args.location,
          bio: args.bio,
        });
        return userProfile.save();
      },
    },
    addUserProfileImage: {
      type: ProfileImageType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        url: { type: new GraphQLNonNull(GraphQLString) },
        userProfile: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        const img = await ProfileImage.findOne({
          userProfile: args.userProfile,
        });

        if (img && img.id) {
          const updateImg = await ProfileImage.findOneAndUpdate(
            { _id: img.id },
            { url: args.url }
          );
          return updateImg;
        }

        const saveProfileImage = new ProfileImage({
          name: args.name,
          url: args.url,
          userProfile: args.userProfile,
        });
        return saveProfileImage.save();
      },
    },
    addPost: {
      type: PostType,
      args: {
        caption: { type: new GraphQLNonNull(GraphQLString) },
        postUrl: { type: new GraphQLNonNull(GraphQLString) },
        location: { type: new GraphQLNonNull(GraphQLString) },
        user: { type: new GraphQLNonNull(GraphQLID) },
        mentions: {
          type: new GraphQLList(GraphQLID),
        },
      },
      resolve(parent, args) {
        const saveProfileImage = new Post({
          caption: args.caption,
          postUrl: args.postUrl,
          location: args.location,
          user: args.user,
          mentions: args.mentions,
        });
        return saveProfileImage.save();
      },
    },
    likePostToggle: {
      type: LikeType,
      args: {
        postId: { type: new GraphQLNonNull(GraphQLID) },
        userId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        const like = await Like.findOne({
          postId: args.postId,
          userId: args.userId,
        });
        let updatedLike;
        if (like && like.id) {
          updatedLike = await Like.findByIdAndDelete(like.id);
        } else {
          updatedLike = await Like.create({
            postId: args.postId,
            userId: args.userId,
          });
        }
        return updatedLike;
      },
    },
    commentPost: {
      type: CommentType,
      args: {
        postId: { type: new GraphQLNonNull(GraphQLID) },
        userId: { type: new GraphQLNonNull(GraphQLID) },
        comment: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        return Comment.create({
          postId: args.postId,
          userId: args.userId,
          comment: args.comment,
        });
      },
    },
    followUser: {
      type: UserProfileType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLID) },
        followingId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        const userProf = await UserProfile.findOne({ user: args.userId });
        userProf.following = [...userProf.following, args.followingId];
        await userProf.populate('following').save();

        const anotherUser = await UserProfile.findOne({
          user: args.followingId,
        });
        anotherUser.followers = [...anotherUser.followers, args.userId];
        anotherUser.save();

        const groupExist = await Group.find({
          members: {
            $all: [args.userId, args.followingId],
          },
          groupType: 'Duo',
        });

        if (groupExist && groupExist.length === 0) {
          await Group.create({
            groupType: 'Duo',
            members: [args.userId, args.followingId],
            chatRoom: 'userChatRoomNoName',
            backgroundImage: 'none',
          });
        }

        return userProf;
      },
    },
    unfollowUser: {
      type: UserProfileType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLID) },
        unfollowingId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        const user = await UserProfile.findOne({ user: args.userId });
        user.following = user.following.filter(
          (x) => x.id !== args.unfollowingId
        );
        user.save();

        const anotherUser = await UserProfile.findOne({
          user: args.unfollowingId,
        });

        anotherUser.followers = anotherUser.followers.filter(
          (x) => x.id !== args.userId
        );
        anotherUser.save();

        return user;
      },
    },
    createGroup: {
      type: GroupType,
      args: {
        groupType: { type: new GraphQLNonNull(GraphQLString) },
        members: { type: new GraphQLList(GraphQLID) },
        chatRoom: { type: new GraphQLNonNull(GraphQLString) },
        backgroundImage: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parents, args) => {
        return Group.create({
          groupType: args.groupType,
          members: args.members,
          chatRoom: args.chatRoom,
          backgroundImage: args.backgroundImage,
        });
      },
    },
  },
});

export default Mutation;
