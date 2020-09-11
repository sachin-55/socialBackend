import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import cors from 'cors';

import MainRouter from './routes/index';
import schema from './schema/schema';

const app = express();
app.use(cors());
const Router = express.Router();

app.use('/', MainRouter(Router));
app.use('/graphiql', graphqlHTTP({ schema, graphiql: true }));

export default app;
