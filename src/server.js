import '@babel/polyfill';

import dotenv from 'dotenv';
import socketIO from 'socket.io';
import app from './index';

const server = require('http').createServer(app);

dotenv.config();

// Server Setup
const { PORT } = process.env;

const io = socketIO.listen(server);

const users = [];

io.sockets.on('connection', (socket) => {
  socket.on('join', (data, callback) => {
    users.push({
      id: socket.id,
      room: data.room,
      user: data.name,
    });
    socket.join(data.room);

    socket.emit('message', {
      user: 'admin',
      text: `${data.name}, welcome to the room ${data.room}`,
    });
    socket.broadcast
      .to(data.room)
      .emit('message', { user: 'admin', text: `${data.name} has joined!` });

    callback();
  });

  socket.on('sendMessage', (data) => {
    console.log('User = ', { users }, '===Message =', { data });
    io.to(data.room).emit('message', {
      user: `${data.name}`,
      text: `${data.message}`,
    });
  });

  socket.on('disconnect', () => {
    const user = users.find((us) => us.id === socket.id);
    socket.leave(user.room);
    console.log('disconnect = ', user);
    if (user) {
      io.to(user.room).emit('message', {
        user: 'admin',
        text: `${user.user} has left room`,
      });
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line
  console.log(`Server running on PORT : ${PORT} 👍 💯`);
});
