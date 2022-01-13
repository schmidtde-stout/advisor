const axios = require('axios');
const environment = require('./services/environment');
const Session = require('express-session');
const FileStore = require('session-file-store')(Session);
const fileStoreOptions = {};

const session = Session({
  store: new FileStore(fileStoreOptions),
  name: 'Advisor',
  secret: environment.sessionSecret,
  cookie: { maxAge: environment.sessionDuration * 60 * 1000 },
  resave: false,
  saveUninitialized: false,
});

axios.defaults.baseURL = environment.advisorApiUrl;
const app = require('./app')(session);

const port = environment.port;
app.listen(port, () => console.log(`Advisor app listening on port ${port}!`));
