const HttpError = require('http-errors');
const log = require('loglevel');
const { authenticateStytchToken, revokeStytchSession } = require('./stytchwrapper');
const { isString, isObject, isEmpty, destroySession, saveSession } = require('./utils');

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
      await saveSession(req);
      log.debug(`Stytch API Success: Authenticated for stytch session ${response.session_token}`);
      next();
    } catch (err) {
      next(
        HttpError(
          err.status_code || err.status || 500,
          `AuthorizationFailed: ${err.error_message || err.message}`
        )
      );
    }
  } else {
    next(HttpError(401, 'Authorization of User Failed: No Token'));
  }
}

async function revokeSession(req, res, next) {
  const token = req.session.session_token;
  try {
    if (isString(token)) {
      await revokeStytchSession(token);
    }
    await destroySession(req);
    log.debug(`Stytch API Success: destroyed express & stytch session ${token}`);
    next();
  } catch (err) {
    next(
      HttpError(
        err.status_code || err.status || 500,
        `Revoke of Session Failed: ${err.error_message || err.message}`
      )
    );
  }
}

module.exports = {
  authenticateUser,
  isUserLoaded,
  revokeSession,
};
