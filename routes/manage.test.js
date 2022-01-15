const request = require('supertest');
const UserModel = require('../models/User');
const auth = require('../services/auth');
const { JSDOM } = require('jsdom');

const mockUser = new UserModel({
  id: '1000',
  email: 'master@uwstout.edu',
  userId: 'user-test-someguid',
  enable: 'true',
  role: 'admin',
});

jest.mock('../services/auth', () => {
  return {
    authenticateUser: jest.fn(),
    revokeSession: jest.fn(),
    isUserLoaded: jest.fn(),
  };
});

function resetMockIsUserLoaded() {
  auth.isUserLoaded.mockImplementation((req, res, next) => {
    req.session = {
      session_token: 'thisisatoken',
      user: mockUser,
    };
    next();
  });
}

const app = require('../app')();

describe('Manage Route Tests', () => {
  beforeEach(() => {
    resetMockIsUserLoaded();
  });

  describe('Manage Index Page Tests', () => {
    test('basic page checks', async () => {
      const response = await request(app).get('/manage');
      const doc = new JSDOM(response.text).window.document;

      // check the main navbar
      expect(doc.querySelector('.navbar-nav>.active').getAttribute('href')).toBe('/manage');
      expect(doc.querySelector('.navbar-nav>.navbar-text').innerHTML).toContain(
        'master@uwstout.edu'
      );
    });
  });
});
