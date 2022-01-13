const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../controllers/User');
const createError = require('http-errors');
const { isUserLoaded, authenticateUser, revokeSession } = require('../services/auth');

module.exports = function () {
  const router = express.Router();
  const appDir = path.dirname(require.main.filename);

  router.use(express.static(path.join(appDir, 'static')));
  router.use(bodyParser.json());

  router.get('/', isUserLoaded, async (req, res) => {
    res.redirect('/admin'); // placeholder for now, probably won't eventually land on admin page
  });

  router.get('/login', async (req, res) => {
    res.sendFile(path.join(appDir, 'static', 'signupOrLogin.html'));
  });

  router.post('/magic', async (req, res) => {
    req.session.userId = req.body.userId;
    req.session.email = req.body.email;
    req.session.save(function (err) {
      if (err) console.error(err);
      res.sendStatus(200);
    });
  });

  router.get('/authenticate', authenticateUser, async (req, res, next) => {
    if (!req.session.authenticated) {
      next(createError(403, 'There was an error authenticating the user.'));
    }
    try {
      const user = await User.create(
        req.session.session_token,
        req.session.userId,
        req.session.email
      );
      req.session.user = user;
      req.session.save(function (err) {
        if (err) console.error(err);
        res.redirect('/');
      });
    } catch (error) {
      next(createError(500, error.message));
    }
  });

  router.get('/logout', revokeSession, async (req, res) => {
    res.redirect('/login');
  });

  const adviseRoutes = require('./advise')();
  const manageRoutes = require('./manage')();
  const adminRoutes = require('./admin')();
  router.use('/advise', adviseRoutes);
  router.use('/manage', manageRoutes);
  router.use('/admin', adminRoutes);

  return router;
};
