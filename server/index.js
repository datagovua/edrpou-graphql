import express from 'express';
import graphQLHTTP from 'express-graphql';
import cors from 'cors';


import schema from './schema';

const app = express();

const formatError = (error) => {
  var err = {
    message: error.message,
    locations: error.locations,
    stack: error.stack
  }
  console.log(JSON.stringify(err));
  delete err.stack;
  return err;
};

app.use('/', cors(), graphQLHTTP({
  schema,
  graphiql: true,
  formatError
}));

app.listen(80);
