require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  advisorApiUrl: process.env.ADVISOR_API_URL || 'http://localhost:3000/',
  stytchProjectId: process.env.STYTCH_PROJECT_ID,
  stytchSecret: process.env.STYTCH_SECRET,
  stytchEnv: process.env.STYTCH_ENV || 'https://test.stytch.com/v1/',
  sessionSecret: process.env.SESSION_SECRET,
  sessionDuration: process.env.SESSION_DURATION || 60,
  pgConnectionString: process.env.PG_CONNECTION_STRING,
};
