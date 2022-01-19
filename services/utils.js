function isEmpty(value) {
  return (
    (isString(value) && value.length === 0) || (isObject(value) && Object.keys(value).length === 0)
  );
}

function isArray(a) {
  return !!a && a.constructor === Array;
}

function isObject(a) {
  return !!a && a.constructor === Object;
}

function isString(a) {
  return typeof a === 'string' || a instanceof String;
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

module.exports = {
  isEmpty,
  isArray,
  isObject,
  isString,
  saveSession,
  destroySession,
};
