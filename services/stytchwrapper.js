const stytch = require('stytch');
const env = require('./environment');

function authenticateStytchToken(token) {
  const client = new stytch.Client({
    project_id: env.stytchProjectId,
    secret: env.stytchSecret,
    env: env.stytchEnv,
  });
  const result = client.magicLinks.authenticate(token, {
    session_duration_minutes: env.sessionDuration,
  });
  return result;
}

function revokeStytchSession(sessionToken) {
  const client = new stytch.Client({
    project_id: env.stytchProjectId,
    secret: env.stytchSecret,
    env: env.stytchEnv,
  });
  const result = client.sessions.revoke({
    session_token: sessionToken,
  });
  return result;
}
module.exports = {
  authenticateStytchToken,
  revokeStytchSession,
};
