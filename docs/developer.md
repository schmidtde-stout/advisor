## Developer Notes for Advisor FE

### Development Environment Setup

#### Required Tools

- Node.js
- Visual Studio Code
- GitHub Desktop

#### Setup Instructions

Install the above tools, accept all defaults. Create a GitHub account with your UW-Stout email address. See notes on [README](/README.md) for instructions on how to clone this repo and install the npm packages.

_Tools Setup_

- Install the following vscode extensions:
  eslint, prettier, prettier eslint, markdown all in one

- Make the following vscode setting changes:

  - Editor: Format on Save - turn on
  - Editor: Default Formatter - Prettier - Code Formatter (esbenp.prettier-vscode)
  - Eslint › Code Actions On Save: Mode - set to problems

**To run the API server**, from a terminal: run `npm start`

**To run the API server with nodemon**, from a terminal: run `npm run dev`, this will monitor for changes to codebase and will restart the server automatically if it detects a change, pretty nice for active development and testing.

**To run the API server in debug**, with vcode: Run > Start Debugging, Select Node.js if prompted

**To run all Jest tests**, from a terminal: run `npm test`

**To run all Jest tests in debug**, from a terminal: run `npm run test:debug`

**To run an individual test**, from a terminal (in windows): run `npx jest -t "the test name"`. The test name is the first parameter in a jest test block, i.e. `test('the test name', async () => { ... `

**To run all tests in an test file**, from a terminal (in windows): run `npx jest <test file>`. e.g. `npx jest users.test.js`

### Development Conventions

- Modules are either:
  - Interface, module.exports is an object, i.e. Services, Models
  - Instance, module.exports is a function returning in an instance, Apps and Routes
- camelCase naming convention shall be used for all naming. This includes Model columns, JSON fields, and Database table columns. Note that the Stytch API uses a snake_case convention.
- All requires() that import from a node_module should be listed on top
- All requires() that import a function should be listed next on top
- All requires() that import an object should be listed after, in it's appropriately used scope
- Never push directly to the main or staging branches, use Pull requests only

### Error Handling

- All routes, if a thrown error is possible, should catch and forward (next(error)) to the Error handler in app.js
- If middleware (e.g. authenticateUser) encounters an unrecoverable error it should throw an HttpError
- All thrown errors should use http-errors modules to create errors

### Logging

- Always use `const log = require('loglevel');`
- Every route should have a log.info on a successful request
- thrown HttpErrors are caught and logged in the middleware error handler (in app.js), no additional logging is necessary
- Underlying services and middleware may use log.debug for logging successful events
- log.trace can be used for adhoc debugging, but should not be committed
- The logging level is set in the LOG_LEVEL environment variable, it defaults to `info`

### Definition of Done

The following criteria should be met before a Pull Request is created for the staging or main branches.

- Models require unit testing all non-trivial functions
- Controllers require unit testing mocking all APIs
- Serializers doing non-trivial transforms should be unit tested
- Routes should be tested mocking controllers and services as needed (i.e. isUserLoaded)
- Source code is fully linted with no warnings
- All jest tests run successfully.
- Tests should achieve 100% coverage. Documentation and explanation should justify any exceptions.
