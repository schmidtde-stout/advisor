const axios = require('axios').default;
const { deSerializeUser } = require('../serializers/User');
const User = require('../models/User');

// if successful return a User model object
// if error, an error is thrown with a message, this way the caller
// doesn't need to the underlying network (axios, advisor api, etc.)
// NOTE: Use caution if attempt to use a Promise instead,
// throwing errors was problematic, didn't determine root cause
async function create(session) {
  const userId = session.userId;
  const email = session.email;
  axios.defaults.headers.common.Authorization = `Bearer ${session.session_token}`;
  try {
    const response = await axios.post('users', {
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

async function fetchAll(session, offset, limit) {
  axios.defaults.headers.common.Authorization = `Bearer ${session.session_token}`;
  try {
    const response = await axios.get(`users?offset=${offset}&limit=${limit}`);
    if (response.status === 200 || response.status === 200) {
      const deSerializedData = response.data.map(deSerializeUser);
      return deSerializedData.map((params) => new User(params));
    } else {
      throw new Error(`Error ${response.status}: ${response.data.Error}`);
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
