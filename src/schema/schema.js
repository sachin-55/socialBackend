import * as graphql from 'graphql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cloudinary from 'cloudinary';

import User from '../models/user';
import UserProfile from '../models/userProfile';
import ProfileImage from '../models/profileImages';
import Post from '../models/post';
import UserState from '../models/userState';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
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
  }),
});

const UserStateType = new GraphQLObjectType({
  name: 'UserState',
  fields: () => ({
    id: { type: GraphQLID },
    online: { type: GraphQLString },
    lastSeen: { type: GraphQLString },
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
  }),
});

const ProfileImageType = new GraphQLObjectType({
  name: 'ProfileImage',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    url: { type: GraphQLString },
    active: { type: GraphQLBoolean },
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

const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    caption: { type: GraphQLString },
    postUrl: { type: GraphQLString },
    location: { type: GraphQLString },
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
  }),
});

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
    userState: {
      type: UserStateType,
      args: { userId: { type: GraphQLID } },
      resolve(parent, args) {
        return UserState.find({ user: args.userId });
      },
    },
  },
});

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
          online: true,
          lastSeen: Date.now(),
        });
        await userState.save();

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
      type: UserProfileType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        url: { type: new GraphQLNonNull(GraphQLString) },
        active: { type: new GraphQLNonNull(GraphQLBoolean) },
        userProfile: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args) {
        const saveProfileImage = new ProfileImage({
          name: args.name,
          url: args.url,
          active: args.active,
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
        console.log(
          args.caption,
          args.postUrl,
          args.location,
          args.user,
          args.mentions
        );
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
    followUser: {
      type: UserProfileType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLID) },
        followingId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        const user = await UserProfile.findById({ id: args.userId });
        user.following.push(args.followingId);
        user.save();

        const anotherUser = await UserProfile.findById({
          id: args.followingId,
        });
        anotherUser.followers.push(args.userId);
        anotherUser.save();

        return user;
      },
    },
    unfollowUser: {
      type: UserProfileType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLID) },
        unfollowingId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        const user = await UserProfile.findById({ id: args.userId });
        user.following = user.following.filter((x) => x !== args.unfollowingId);
        user.save();

        const anotherUser = await UserProfile.findById({
          id: args.followingId,
        });
        anotherUser.followers = anotherUser.followers.filter(
          (x) => x !== args.userId
        );
        anotherUser.save();

        return user;
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
