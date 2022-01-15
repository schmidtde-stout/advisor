# advisor001-fe

The Program Course Advisor (Advisor) is an app designed to facilitate easier course planning for students and advisors of UW-Stout. The app is being developed in the CS458 capstone course.

This repository is the Node.js EJS Front-End for the Advisor web app.

[Developer Notes](docs/developer.md)

### Running the API

#### Prerequisite:

- Node.js 14+ must be installed first.
- The Advisor API Server must be running and accessible (e.g. http://localhost:3000)

#### Setup Steps

- Clone this repo
- Create a .env in the root of this repo, and set the following environment variables:

  ```env
  PORT=3001
  STYTCH_PROJECT_ID=<See Canvas Notes>
  STYTCH_SECRET=<See Canvas Notes>
  SESSION_SECRET=<Used to sign the session ID cookie, should be a random set of characters, see https://cryptotools.net/hash>
  STYTCH_ENV=https://test.stytch.com/v1/
  ADVISOR_API_URL=<Noted above, this can be omitted if running the API Server locally on :3000>

  ```

- Open a terminal in the root of this repo:

  - Run `npm install`
  - Run `npm start`

- Open a browser to http://localhost:3001
