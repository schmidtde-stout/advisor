const request = require('supertest');
const HttpError = require('http-errors');
const { JSDOM } = require('jsdom');
const log = require('loglevel');
const UserModel = require('../models/User');
const User = require('../controllers/User');
const auth = require('../services/auth');
const utils = require('../services/utils');

beforeAll(() => {
  log.disableAll();
});

jest.mock('../controllers/User', () => {
  return {
    create: jest.fn(),
  };
});

jest.mock('../services/auth', () => {
  return {
    authenticateUser: jest.fn(),
    revokeSession: jest.fn().mockImplementation((req, res, next) => {
      req.session = null;
      next();
    }),
    isUserLoaded: jest.fn(),
  };
});

jest.mock('../services/utils', () => {
  const originalModule = jest.requireActual('../services/utils');
  return {
    __esModule: true,
    ...originalModule,
    saveSession: jest.fn(),
  };
});

const mockUser = new UserModel({
  id: '1000',
  email: 'master@uwstout.edu',
  userId: 'user-test-someguid',
  enable: 'true',
  role: 'admin',
});

function mockUserIsLoggedIn() {
  auth.isUserLoaded.mockReset();
  auth.isUserLoaded.mockImplementationOnce((req, res, next) => {
    req.session = {
      session_token: 'thisisatoken',
      user: mockUser,
    };
    next();
  });
}

function mockUserIsLoggedOut() {
  auth.isUserLoaded.mockReset();
  auth.isUserLoaded.mockImplementationOnce((req, res, next) => {
    req.session = {};
    res.redirect('/login');
  });
}

const app = require('../app')();

describe('Index Route Tests', () => {
  test('check the default error handler', async () => {
    const response = await request(app).get('/doesnotexists');
    expect(response.statusCode).toBe(404);
  });

  describe('Index Page Tests', () => {
    test('basic page checks - authenticated', async () => {
      mockUserIsLoggedIn();
      const response = await request(app).get('/');
      // redirects to admin (for now)
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin');
    });

    test('basic page checks - not authenticated', async () => {
      mockUserIsLoggedOut();
      const response = await request(app).get('/');
      // redirects to admin (for now)
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/login');
    });
  });

  describe('Logout Page Tests', () => {
    // since we are mocking revokeSession in a very basic way, it's overkill to test both loggedIn and loggedOut
    test('basic page checks', async () => {
      mockUserIsLoggedIn();
      const response = await request(app).get('/logout');
      // redirects to admin (for now)
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/login');
    });
  });

  describe('Login Page Tests', () => {
    test('basic page checks', async () => {
      const response = await request(app).get('/login');
      expect(response.statusCode).toBe(200);
      const doc = new JSDOM(response.text).window.document;
      expect(doc.querySelector('#advisor-welcome')).not.toBeNull();
    });
  });

  // NOTE:  We are currently not doing Magic Page tests because it's sole purpose
  // is to save some basic info (email, userId) from the pending Stytch magic link request
  // In order to mock session information, which is part of req, we need
  // middleware to mock (e.g. auth.isUserLoaded).  Right now /magic has no middleware
  // call, and it seems overkill to setup middleware just for a mock.  Especially
  // right now /magic is effectively just a setter.  So, as per DOD, for now
  // we will not write test for it, might revisit if /magic needs more complex logic

  // /authenticate a link created by Stytch and received in an email
  describe('authenticate Tests', () => {
    beforeEach(() => {
      User.create.mockReset();
      auth.authenticateUser.mockReset();
      utils.saveSession.mockReset();
    });

    test('happy path', async () => {
      const token = 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q';
      auth.authenticateUser.mockImplementationOnce((req, res, next) => {
        req.session = {
          session_token: token,
          userId: mockUser.userId, // NOTE: Technically this is inserted into session by /magic
          email: mockUser.email, // NOTE: Technically this is inserted into session by /magic
        };
        next();
      });
      utils.saveSession.mockResolvedValue();
      User.create.mockResolvedValue(mockUser);
      const response = await request(app).get(`/authenticate?token=${token}`);
      expect(User.create.mock.calls).toHaveLength(1);
      expect(User.create.mock.calls[0][0]).toBe(token);
      expect(User.create.mock.calls[0][1]).toBe(mockUser.userId);
      expect(User.create.mock.calls[0][2]).toBe(mockUser.email);
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');
      expect(utils.saveSession).toBeCalled();
    });

    test('authenticate success - save session failure', async () => {
      const token = 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q';
      auth.authenticateUser.mockImplementationOnce((req, res, next) => {
        req.session = {
          session_token: token,
          userId: mockUser.userId, // NOTE: Technically this is inserted into session by /magic
          email: mockUser.email, // NOTE: Technically this is inserted into session by /magic
        };
        next();
      });
      utils.saveSession.mockRejectedValue(new Error('save session failure'));
      User.create.mockResolvedValue(mockUser);
      const response = await request(app).get(`/authenticate?token=${token}`);
      expect(User.create.mock.calls).toHaveLength(1);
      expect(User.create.mock.calls[0][0]).toBe(token);
      expect(User.create.mock.calls[0][1]).toBe(mockUser.userId);
      expect(User.create.mock.calls[0][2]).toBe(mockUser.email);
      expect(response.statusCode).toBe(500);
      expect(utils.saveSession).toBeCalled();
    });

    test('authentication from stytch success, but User.create thrown error', async () => {
      const token = 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q';
      auth.authenticateUser.mockImplementationOnce((req, res, next) => {
        req.session = {
          session_token: token,
          userId: mockUser.userId, // NOTE: Technically this is inserted into session by /magic
          email: mockUser.email, // NOTE: Technically this is inserted into session by /magic
        };
        next();
      });
      User.create.mockRejectedValue(HttpError(500, `Advisor API Error`));
      const response = await request(app).get(`/authenticate?token=${token}`);
      expect(User.create.mock.calls).toHaveLength(1);
      expect(User.create.mock.calls[0][0]).toBe(token);
      expect(User.create.mock.calls[0][1]).toBe(mockUser.userId);
      expect(User.create.mock.calls[0][2]).toBe(mockUser.email);
      expect(response.statusCode).toBe(500);
      expect(utils.saveSession).not.toBeCalled();
    });

    test('authenticateUser - no token from auth.authenticateUser', async () => {
      const token = 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q';
      auth.authenticateUser.mockImplementationOnce((req, res, next) => {
        req.session = {
          userId: mockUser.userId,
          email: mockUser.email,
        };
        next(HttpError(403, 'no token from auth.authenticateUser'));
      });
      const response = await request(app).get(`/authenticate?token=${token}`);
      expect(response.statusCode).toBe(403);
      expect(utils.saveSession).not.toBeCalled();
    });

    test('authenticateUser - no token passed parameter', async () => {
      auth.authenticateUser.mockImplementationOnce((req, res, next) => {
        req.session = {
          userId: mockUser.userId,
          email: mockUser.email,
        };
        next(HttpError(401, 'Authorization of User Failed: No Token'));
      });
      const response = await request(app).get(`/authenticate`);
      expect(response.statusCode).toBe(401);
      expect(utils.saveSession).not.toBeCalled();
    });
  });
});
