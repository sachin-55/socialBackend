import UserState from '../models/userState';
import UserProfile from '../models/userProfile';
import Conversation from '../models/conversation';
import Group from '../models/group';

const addUserSocketId = async (socketId, userId) => {
  try {
    const user = await UserState.findOne({
      user: userId,
    });
    if (user) {
      user.socketId = socketId;
      user.online = true;
      user.lastSeen = Date.now();
      user.save();
      console.log('User added');
    }
  } catch (error) {
    console.log(error);
  }
};

const removeUserSocketId = async (socketId) => {
  try {
    const user = await UserState.findOne({
      socketId: socketId,
    });
    if (user) {
      // user.socketId = null;
      user.online = false;
      user.lastSeen = Date.now();
      user.save();
      console.log('User removed');
    }
  } catch (error) {
    console.log(error);
  }
};

const getOnlineUsers = async (userId) => {
  try {
    const user = await UserProfile.findOne({
      user: userId,
    });

    const followingIds =
      user && user.following && user.following.map((x) => x.id);

    const followerIds =
      user && user.followers && user.followers.map((x) => x.id);

    const uniqueIds = followingIds.concat(
      followerIds.filter((fid) => followingIds.indexOf(fid) < 0)
    );
    const commonIds = followerIds.filter(
      (fid) => followingIds.indexOf(fid) > -1
    );

    const noFollowingIds = uniqueIds.filter(
      (x) => followerIds.includes(x) && !followingIds.includes(x)
    );
    const noFollowBackIds = uniqueIds.filter(
      (x) => !followerIds.includes(x) && followingIds.includes(x)
    );

    const onlineUsers = await UserState.find({
      online: true,
      user: {
        $in: uniqueIds,
      },
    });
    const onlineUserIds = onlineUsers.map((x) => x.user);

    return {
      onlineUserIds,
      noFollowBackIds,
      noFollowingIds,
      uniqueUserIds: uniqueIds,
      commonUserIds: commonIds,
    };
  } catch (error) {
    console.log(error);
  }
};

const saveMessage = async ({ message, senderId, groupId }) => {
  try {
    return await Conversation.create({
      message,
      senderId,
      groupId,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getSocketId = async ({ receiverId }) => {
  try {
    const userState = await UserState.findOne({
      user: receiverId,
    });

    return userState.socketId;
  } catch (error) {
    throw new Error(error);
  }
};

export {
  getOnlineUsers,
  removeUserSocketId,
  addUserSocketId,
  saveMessage,
  getSocketId,
};
