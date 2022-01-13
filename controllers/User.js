const axios = require('axios');
const { deSerializeUser } = require('../serializers/User');
const User = require('../models/User');

// if successful return a User model object
// if error, an error is thrown with a message, this way the caller
// doesn't need to the underlying network (axios, advisor api, etc.)
// NOTE: Use caution if attempt to use a Promise instead,
// throwing errors was problematic, didn't determine root cause
async function create(sessionToken, userId, email) {
  const request = axios.create({
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  try {
    const response = await request.post('users', {
      email: email,
      userId: userId,
    });
    if (response.status === 200 || response.status === 201) {
      const userParms = deSerializeUser(response.data);
      return new User(userParms);
    } else {
      throw new Error(`Error ${response.status}: ${response.data.Error}`);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function fetchAll(sessionToken, offset, limit) {
  const request = axios.create({
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  try {
    const response = await request.get(`users?offset=${offset}&limit=${limit}`);
    if (response.status === 200) {
      const deSerializedData = response.data.map(deSerializeUser);
      return deSerializedData.map((params) => new User(params));
    } else {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
  create,
  fetchAll,
};
