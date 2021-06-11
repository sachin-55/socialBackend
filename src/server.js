import '@babel/polyfill';

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import app from './index';
import sockets from './socket';

const server = createServer(app);

dotenv.config();

// Server Setup
const { PORT, DB_URL } = process.env;

// Database Connection
mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('Database Connection Success 👍 💁 💯'));

server.listen(PORT, () => {
  // eslint-disable-next-line
  console.log(`Server running on PORT : ${PORT} 👍 💯`);
});

sockets(server);
