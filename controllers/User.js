const axios = require('axios');
const log = require('loglevel');
const { deSerializeUser } = require('../serializers/User');
const User = require('../models/User');
const HttpError = require('http-errors');

// if successful return a User model object
// if error, an error is thrown with a message, this way the caller
// doesn't need to the underlying network (axios, advisor api, etc.)
// NOTE: Use caution if attempt to use a Promise instead,
// throwing errors was problematic, didn't determine root cause
async function create(sessionToken, userId, email) {
  const request = axios.create({
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  const response = await request.post('users', {
    email: email,
    userId: userId,
  });
  if (response.status === 200 || response.status === 201) {
    const userParms = deSerializeUser(response.data);
    const user = new User(userParms);
    log.debug(`Advisor API Success: Created (${response.status}) User ${user.id} (${user.email})`);
    return user;
  } else {
    throw HttpError(500, `Advisor API Error ${response.status}: ${response.data.Error}`);
  }
}

async function fetchAll(sessionToken, offset, limit) {
  const request = axios.create({
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  const response = await request.get(`users?offset=${offset}&limit=${limit}`);
  if (response.status === 200) {
    const deSerializedData = response.data.map(deSerializeUser);
    const users = deSerializedData.map((params) => new User(params));
    log.debug(
      `Advisor API Success: Retrieved ${users.length} User(s) with offset=${offset}, limit=${limit}`
    );
    return users;
  } else {
    throw HttpError(500, `Advisor API Error ${response.status}: ${response.data.error.message}`);
  }
}

module.exports = {
  create,
  fetchAll,
};
