import express from 'express';
import graphQLHTTP from 'express-graphql';
import cors from 'cors';
import Rollbar from 'rollbar';

import schema from './schema';


const rollbar = new Rollbar("0fe09289a0e44d2a93fead6605d23983");

const app = express();

const formatError = (error, req) => {
  var err = {
    message: error.message,
    locations: error.locations,
    stack: error.stack
  }
  console.log(JSON.stringify(err));
  rollbar.error("GraphQL error", err);
  delete err.stack;
  return err;
};

app.use('/', cors(), graphQLHTTP(req => ({
  schema,
  graphiql: true,
  formatError: error => formatError(error, req)
})));

app.listen(80);
