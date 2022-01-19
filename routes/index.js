const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const log = require('loglevel');
const User = require('../controllers/User');
const { isUserLoaded, authenticateUser, revokeSession } = require('../services/auth');
const { saveSession } = require('../services/utils');

module.exports = function () {
  const router = express.Router();
  const appDir = path.dirname(require.main.filename);

  router.use(express.static(path.join(appDir, 'static')));
  router.use(bodyParser.json());

  router.get('/', isUserLoaded, async (req, res) => {
    res.redirect('/admin'); // placeholder for now, probably won't eventually land on admin page
    log.info(`${req.method} ${req.originalUrl} success: redirecting to /admin page`);
  });

  router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'static', 'signupOrLogin.html'));
    log.info(`${req.method} ${req.originalUrl} success: presenting login form`);
  });

  router.post('/magic', async (req, res, next) => {
    try {
      req.session.userId = req.body.userId;
      req.session.email = req.body.email;
      await saveSession(req);
      res.sendStatus(200);
      log.info(`${req.method} ${req.originalUrl} success: saved session for ${req.body.email}`);
    } catch (error) {
      next(error);
    }
  });

  router.get('/authenticate', authenticateUser, async (req, res, next) => {
    try {
      const user = await User.create(
        req.session.session_token,
        req.session.userId,
        req.session.email
      );
      req.session.user = user;
      await saveSession(req);
      res.redirect('/');
      log.info(`${req.method} ${req.originalUrl} success: redirecting to / page`);
    } catch (error) {
      next(error);
    }
  });

  router.get('/logout', revokeSession, async (req, res) => {
    res.redirect('/login');
    log.info(`${req.method} ${req.originalUrl} success: redirecting to /login page`);
  });

  const adviseRoutes = require('./advise')();
  const manageRoutes = require('./manage')();
  const adminRoutes = require('./admin')();
  router.use('/advise', adviseRoutes);
  router.use('/manage', manageRoutes);
  router.use('/admin', adminRoutes);

  return router;
};
