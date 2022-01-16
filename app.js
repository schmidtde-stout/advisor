const express = require('express');
const path = require('path');
const createError = require('http-errors');
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
    return next(new createError.NotFound());
  });

  // error handler middleware
  app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
      error: {
        status: error.status || 500,
        message: error.message || 'Internal Server Error',
      },
    });
  });

  return app;
};
