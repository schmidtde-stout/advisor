const express = require('express');
const path = require('path');
const HttpError = require('http-errors');
const flash = require('express-flash');

module.exports = (session) => {
  const app = express();
  if (session != null) {
    app.use(session);
  }

  app.use(flash());
  const routes = require('./routes')();
  app.use('/', routes);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // default error catch
  app.use((request, response, next) => {
    return next(new HttpError.NotFound());
  });

  // error handler middleware
  app.use((error, req, res, next) => {
    res.status(error.statusCode || error.status || 500).send({
      error: {
        status: error.statusCode || error.status || 500,
        message: error.message || 'Internal Server Error',
      },
    });
  });

  return app;
};
