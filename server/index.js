import express from 'express';
import graphQLHTTP from 'express-graphql';
import cors from 'cors';
import Rollbar from 'rollbar';

import schema from './schema';


const rollbar = new Rollbar({
  accessToken: "0fe09289a0e44d2a93fead6605d23983",
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const app = express();

const ignoredMessages = ["Must provide query string"];
const shouldIgnore = (error) => {
  try {
    return ignoredMessages.map((ignored) => error.message.includes(ignored)).some(el => el === true);
  } catch(e) {
    console.log(e)
  }
}

const fillErrorName = (err) => {
  let errorName;
  try {
    errorName = err.stack.split('\n')[0].split(/[:(]/)[0];
  } catch(_) {}
  if(errorName && !err.name) {
    err.name = errorName;
  }
}

const rollbarError = (err) => {
  if(err) {
    console.log('Error reporting to Rollbar', err);
  }
}

const formatError = (error, req) => {
  let err = {
    message: error.message,
    locations: error.locations,
    stack: error.stack
  }

  fillErrorName(err);
  if(!shouldIgnore(err)) {
    console.log(JSON.stringify(err));
    if (error instanceof Error) {
      return rollbar.error(err.name, err, req, rollbarError);
    }
    rollbar.error('GraphQL error: ' + err, req, rollbarError);
  }
  delete err.stack;
  return err;
};


const handleNonRoot = function (req, res, next) {
  if(req.path === '/favicon.ico') {
    res.status(404)
   .send('Not found');
  } else {
    next();
  }
}

app.use('/', handleNonRoot, cors(), graphQLHTTP(req => ({
  schema,
  graphiql: true,
  formatError: error => formatError(error, req)
})));

app.listen(80);
