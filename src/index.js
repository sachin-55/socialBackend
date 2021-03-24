import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import cors from 'cors';
import bodyParser from 'body-parser';

import morgan from 'morgan';
import MainRouter from './routes/index';
import schema from './schema/schema';

const app = express();
const Router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/', MainRouter(Router));
app.use('/graphiql', graphqlHTTP({ schema, graphiql: true }));

export default app;
