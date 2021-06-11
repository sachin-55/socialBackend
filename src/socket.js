import socketIO from 'socket.io';
import {
  getOnlineUsers,
  removeUserSocketId,
  addUserSocketId,
  saveMessage,
  getSocketId,
} from './utils/socketHelpers';

const users = [];

export default (server) => {
  const io = socketIO.listen(server);

  io.sockets.on('connection', async (socket) => {
    const { userId } = socket.handshake.query;

    if (userId) {
      await addUserSocketId(socket.id, userId);
      console.log('Connected', socket.id);
    }

    socket.on('collect-online-users', async (data) => {
      const onlineUsers = await getOnlineUsers(data.userId);
      socket.emit('online-users', {
        onlineUsers,
      });
    });

    socket.on('send-message', async (data, callback) => {
      const { message, senderId, groupId, receiverId } = data;

      const chat = await saveMessage({
        message,
        senderId,
        groupId,
      });

      const socketId = await getSocketId({
        receiverId,
      });
      if (socketId) {
        io.to(socketId).emit('receive-message', chat);
      }
      callback(chat);
    });

    socket.on('disconnect', () => {
      const user = users.find((us) => us.id === socket.id);
      if (user && user.room) {
        socket.leave(user.room);
      }
      removeUserSocketId(socket.id);
      console.log('disconnect = ', socket.id);
    });
  });
};
