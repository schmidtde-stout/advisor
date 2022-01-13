const { authenticateStytchToken, revokeStytchSession } = require('./stytchwrapper');
const { isString, isObject } = require('./utils');

function isUserLoaded(req, res, next) {
  if (
    req.session.authenticated &&
    isString(req.session.session_token) &&
    isObject(req.session.user)
  ) {
    return next();
  }
  res.redirect('/login');
}

function authenticateUser(req, res, next) {
  const token = req.query.token;
  if (isString(token)) {
    authenticateStytchToken(token)
      .then(
        (result) => {
          req.session.session_token = result.session_token;
          req.session.authenticated = true;
          req.session.save(function (err) {
            if (err) console.error(err);
            return next();
          });
        },
        (rejectReason) => {
          console.log(rejectReason);
          return res
            .status(rejectReason.status_code)
            .send(`Authorization of User Failed: ${rejectReason.error_message}`);
        }
      )
      .catch((err) => {
        console.log(err);
        return res.status(500).send(`Authorization of User Failed: ${err.error_message}`);
      });
  } else {
    return res.status(401).send({ message: 'Authorization of User Failed: No Token' });
  }
}

function destroyExpressSession(req, next) {
  req.session.destroy((err) => {
    if (err) console.error(`Failed to destroy express session: ${err}`);
    return next();
  });
}

function revokeSession(req, res, next) {
  const token = req.session.session_token;
  if (isString(token)) {
    revokeStytchSession(token)
      .then(
        (result) => {
          return destroyExpressSession(req, next);
        },
        (rejectReason) => {
          // if revoking the Stytch session fails, we don't kill the req.session yet since it holds the stytch seession token
          console.log(rejectReason);
          return res
            .status(rejectReason.status_code)
            .send(`Revoke of Session Failed: ${rejectReason.error_message}`);
        }
      )
      .catch((err) => {
        // for the same reason above, we don't kill the req.session
        console.log(err);
        return res.status(500).send(`Revoke of Session Failed: ${err.error_message}`);
      });
  } else {
    // Since we have no token to revoke, just destroy the req.session and move on
    return destroyExpressSession(req, next);
  }
}

module.exports = {
  authenticateUser,
  isUserLoaded,
  revokeSession,
};
