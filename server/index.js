import express from 'express';
import graphQLHTTP from 'express-graphql';
import cors from 'cors';


import schema from './schema';

const app = express();

app.use('/', cors(), graphQLHTTP({
  schema,
  graphiql: true,
}));

app.listen(80);
