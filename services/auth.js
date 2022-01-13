const { authenticateStytchToken, revokeStytchSession } = require('./stytchwrapper');
const { isString, isObject, isEmpty } = require('./utils');

function isUserLoaded(req, res, next) {
  if (
    isObject(req.session) &&
    !isEmpty(req.session) &&
    isString(req.session.session_token) &&
    !isEmpty(req.session.session_token) &&
    isObject(req.session.user) &&
    !isEmpty(req.session.user) &&
    req.session.authenticated
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
          return next();
        },
        (rejectReason) => {
          console.log(rejectReason);
          return res
            .status(rejectReason.status_code)
            .send(`Authorization of User Failed: ${rejectReason.error_message}`);
        }
      )
      .catch((err) => {
        // we get here if the .then() rejects, which shouldn't happen since we are just doing assignments
        console.log(err);
        return res.status(500).send(`Authorization of User Failed: ${err.error_message}`);
      });
  } else {
    return res.status(401).send({ message: 'Authorization of User Failed: No Token' });
  }
}

function destroyExpressSession(req, next) {
  req.session.destroy((err) => {
    if (err) console.log(`Failed to destroy express session: ${err}`);
  });
  return next();
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
          // if revoking the Stytch session fails, we don't kill the req.session yet since it holds the stytch session token
          // this might be the wrong action, more experience with Stytch might be required.
          console.log(`Revoke of Session Failed: ${rejectReason.error_message}`);
          return res
            .status(rejectReason.status_code)
            .send(`Revoke of Session Failed: ${rejectReason.error_message}`);
        }
      )
      .catch((err) => {
        // we get here if the .then() rejects, that means destroyExpressSession had a thrown error, so just return 500 and be done
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
