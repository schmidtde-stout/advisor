const chalk = require('chalk');
const log = require('loglevel');
const prefix = require('loglevel-plugin-prefix');
const axios = require('axios');
const Session = require('express-session');
const environment = require('./services/environment');

// setup logging configuration before we begin:
const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};
prefix.reg(log);
log.setLevel(environment.logLevel);
log.enableAll();
prefix.apply(log, {
  format(level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(
      `${name}:`
    )}`;
  },
});

const FileStore = require('session-file-store')(Session);
const fileStoreOptions = {
  logFn: log.info,
  retries: 2,
};

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

app.listen(environment.port, () =>
  log.info(
    `Advisor App has started with the following configuration:\n${JSON.stringify(
      environment,
      null,
      2
    )}`
  )
);
