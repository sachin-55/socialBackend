import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import cors from 'cors';
import bodyParser from 'body-parser';

import MainRouter from './routes/index';
import schema from './schema/schema';

const app = express();
const Router = express.Router();

app.use(cors());

app.use('/', MainRouter(Router));
app.use(
  '/graphiql',
  bodyParser.json(),
  graphqlHTTP({ schema, graphiql: true })
);

export default app;
