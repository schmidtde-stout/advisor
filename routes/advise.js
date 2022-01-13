const express = require('express');
const bodyParser = require('body-parser');
const { isUserLoaded } = require('../services/auth');

module.exports = function () {
  const router = express.Router();
  router.use(bodyParser.json());
  router.get('/', isUserLoaded, async (req, res) => {
    return res.render('layout', {
      pageTitle: 'Advisor',
      group: 'advise',
      template: 'index',
      email: req.session.user.email,
    });
  });

  return router;
};
