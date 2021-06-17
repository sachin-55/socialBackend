/* eslint-disable no-use-before-define */
import * as graphql from 'graphql';

import User from '../models/user';
import UserProfile from '../models/userProfile';
import ProfileImage from '../models/profileImages';
import Post from '../models/post';
import UserState from '../models/userState';
import Group from '../models/group';
import Conversation from '../models/conversation';

import {
  UserType,
  UserStateType,
  UserProfileType,
  ProfileImageType,
  PostType,
  GroupType,
  ConversationType,
} from './schemaType';

const { GraphQLObjectType, GraphQLID, GraphQLList } = graphql;

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return User.find({});
      },
    },
    usersProfile: {
      type: new GraphQLList(UserProfileType),
      resolve(parent, args) {
        return UserProfile.find({});
      },
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return User.findById(args.id);
      },
    },
    userProfile: {
      type: new GraphQLList(UserProfileType),
      args: { userId: { type: GraphQLID } },
      resolve(parent, args) {
        return UserProfile.find({ user: args.userId });
      },
    },
    userProfileImage: {
      type: new GraphQLList(ProfileImageType),
      args: { userProfileId: { type: GraphQLID } },
      resolve(parent, args) {
        return ProfileImage.find({ userProfile: args.userProfileId });
      },
    },
    post: {
      type: PostType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Post.findById(args.id);
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve(parent, args) {
        return Post.find({}).sort('createdAt');
      },
    },
    userPosts: {
      type: new GraphQLList(PostType),
      args: { userId: { type: GraphQLID } },
      resolve(parent, args) {
        return Post.find({ user: args.userId }).sort('-created_at');
      },
    },
    userNewsFeedPosts: {
      type: new GraphQLList(PostType),
      args: { userId: { type: GraphQLID } },
      resolve: async (parent, args) => {
        const profile = await UserProfile.findOne({ user: args.userId });
        const userFollowing = profile.following.map((x) => x.id);
        const userFollowers = profile.followers.map((x) => x.id);
        const allowedUserPosts = userFollowing.reduce((acc, val) => {
          if (userFollowers.includes(val)) {
            acc.push(val);
          }
          return acc;
        }, []);
        allowedUserPosts.push(args.userId);
        const allPosts = Post.find({
          user: { $in: allowedUserPosts },
        }).sort('-created_at');
        return allPosts;
      },
    },
    userState: {
      type: UserStateType,
      args: { userId: { type: GraphQLID } },
      resolve(parent, args) {
        return UserState.find({ user: args.userId });
      },
    },
    recentlyAddedUsers: {
      type: new GraphQLList(UserType),
      args: { userId: { type: GraphQLID } },
      resolve: async (parent, args) => {
        const user = await UserProfile.findOne({ user: args.userId });
        const followingUsersId = user.following.map((x) => x.id);
        const users = await User.find({
          $and: [
            { _id: { $ne: args.userId } },
            { _id: { $nin: followingUsersId } },
          ],
        }).limit(5);
        return users;
      },
    },
    followings: {
      type: new GraphQLList(UserType),
      args: { userId: { type: GraphQLID } },
      resolve: async (parent, args) => {
        const user = await UserProfile.findOne({ user: args.userId });

        return user.following;
      },
    },
    followers: {
      type: new GraphQLList(UserType),
      args: { userId: { type: GraphQLID } },
      resolve: async (parent, args) => {
        const user = await UserProfile.findOne({ user: args.userId });

        return user.followers;
      },
    },
    uniqueUsers: {
      type: new GraphQLList(UserType),
      args: {
        userIds: {
          type: new GraphQLList(GraphQLID),
        },
      },
      resolve: (parent, args) => {
        return User.find({
          _id: {
            $in: args.userIds,
          },
        });
      },
    },
    getUserGroup: {
      type: new GraphQLList(GroupType),
      args: {
        userId: { type: GraphQLID },
      },
      resolve: (parent, args) => {
        return Group.find({
          members: args.userId,
        });
      },
    },
    getUserConversations: {
      type: new GraphQLList(ConversationType),
      args: {
        groupId: { type: GraphQLID },
      },
      resolve: (parent, args) => {
        return Conversation.find({
          groupId: args.groupId,
        }).sort('created_at');
      },
    },
  },
});

export default RootQuery;
