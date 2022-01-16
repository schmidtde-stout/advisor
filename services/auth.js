const createError = require('http-errors');
const { authenticateStytchToken, revokeStytchSession } = require('./stytchwrapper');
const { isString, isObject, isEmpty } = require('./utils');

function isUserLoaded(req, res, next) {
  if (
    !isEmpty(req.session) &&
    isString(req.session.session_token) &&
    !isEmpty(req.session.session_token) &&
    isObject(req.session.user) &&
    !isEmpty(req.session.user)
  ) {
    return next();
  }
  res.redirect('/login');
}

async function authenticateUser(req, res, next) {
  const token = req.query.token;
  if (isString(token)) {
    delete req.session.session_token;
    try {
      const response = await authenticateStytchToken(token);
      req.session.session_token = response.session_token;
      next();
    } catch (err) {
      next(createError(err.status_code, `Authorization Failed: ${err.error_message}`));
    }
  } else {
    next(createError(401, 'Authorization of User Failed: No Token'));
  }
}

function destroyExpressSession(req, next) {
  req.session.destroy((err) => {
    if (err) console.log(`Failed to destroy express session: ${err}`);
  });
  return next();
}

async function revokeSession(req, res, next) {
  const token = req.session.session_token;
  if (isString(token)) {
    try {
      await revokeStytchSession(token);
      return destroyExpressSession(req, next);
    } catch (err) {
      // if revoking the Stytch session fails, we don't kill the req.session yet since it holds the stytch session token
      // this might be the wrong action, more experience with Stytch is required.
      next(createError(err.status_code, `Revoke of Session Failed: ${err.error_message}`));
    }
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
