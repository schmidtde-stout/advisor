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
    return next(createError(404, 'File not found'));
  });

  return app;
};
