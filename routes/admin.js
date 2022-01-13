const express = require('express');
const bodyParser = require('body-parser');
const { isUserLoaded } = require('../services/auth');
const User = require('../controllers/User');
const createError = require('http-errors');

module.exports = function () {
  const router = express.Router();
  router.use(bodyParser.json());
  router.get('/', isUserLoaded, async (req, res, next) => {
    try {
      const users = await User.fetchAll(req.session.session_token, 0, 100);
      return res.render('layout', {
        pageTitle: 'Advisor Admin',
        group: 'admin',
        template: 'index',
        email: req.session.user.email,
        data: users,
      });
    } catch (error) {
      next(createError(500, error.message));
    }
  });

  return router;
};
