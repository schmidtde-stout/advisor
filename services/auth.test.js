const log = require('loglevel');
const stytchwrapper = require('./stytchwrapper');
const auth = require('./auth');
const utils = require('./utils');
const { getMockReq, getMockRes } = require('@jest-mock/express');

jest.mock('./environment', () => {
  return {
    stytchProjectId: 'project-test-11111111-1111-1111-1111-111111111111',
    stytchSecret: 'secret-test-111111111111',
    stytchEnv: 'test',
  };
});

jest.mock('./stytchwrapper', () => {
  return {
    authenticateStytchToken: jest.fn(),
    revokeStytchSession: jest.fn(),
  };
});

jest.mock('./utils', () => {
  const originalModule = jest.requireActual('./utils');
  return {
    __esModule: true,
    ...originalModule,
    destroySession: jest.fn(),
    saveSession: jest.fn(),
  };
});

const { res, next, clearMockRes } = getMockRes({});

function setupMockReq(token, authenticated) {
  return getMockReq({
    session: {
      session_token: token,
      save: jest.fn(),
      destroy: jest.fn(),
    },
  });
}

beforeAll(() => {
  log.disableAll();
});

describe('auth service tests', () => {
  describe('isUserLoaded tests', () => {
    beforeEach(() => {
      clearMockRes();
      stytchwrapper.revokeStytchSession.mockReset();
    });

    test('isUserLoaded - happy path', async () => {
      const req = getMockReq({
        session: {
          user: {
            id: 1,
          },
          session_token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
        },
      });
      auth.isUserLoaded(req, res, next);
      expect(next).toBeCalled();
      expect(res.redirect).not.toBeCalled();
    });

    test('isUserLoaded - not authenticated', async () => {
      const req = getMockReq({
        session: {
          user: {
            id: 1,
          },
        },
      });
      auth.isUserLoaded(req, res, next);
      expect(next).not.toBeCalled();
      expect(res.redirect).toBeCalled();
    });

    test('isUserLoaded - missing token', async () => {
      const req = getMockReq({
        session: {
          user: {
            id: 1,
          },
        },
      });
      auth.isUserLoaded(req, res, next);
      expect(next).not.toBeCalled();
      expect(res.redirect).toBeCalled();
    });

    test('isUserLoaded - token empty', async () => {
      const req = getMockReq({
        session: {
          user: {
            id: 1,
          },
          session_token: '',
        },
      });
      auth.isUserLoaded(req, res, next);
      expect(next).not.toBeCalled();
      expect(res.redirect).toBeCalled();
    });

    test('isUserLoaded - empty user', async () => {
      const req = getMockReq({
        session: {
          user: {},
          session_token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
        },
      });
      auth.isUserLoaded(req, res, next);
      expect(next).not.toBeCalled();
      expect(res.redirect).toBeCalled();
    });

    test('isUserLoaded - missing user', async () => {
      const req = getMockReq({
        session: {
          session_token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
        },
      });
      auth.isUserLoaded(req, res, next);
      expect(next).not.toBeCalled();
      expect(res.redirect).toBeCalled();
    });
  });

  describe('revokeSession tests', () => {
    beforeEach(() => {
      clearMockRes();
      stytchwrapper.revokeStytchSession.mockReset();
      utils.destroySession.mockReset();
    });

    test('revokeStytchSession - happy path', async () => {
      const req = setupMockReq('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q', true);
      stytchwrapper.revokeStytchSession.mockResolvedValue({});
      utils.destroySession.mockResolvedValue();
      await auth.revokeSession(req, res, next);
      expect(next).toBeCalled();
      expect(next.mock.calls[0]).toHaveLength(0);
      expect(utils.destroySession).toBeCalled();
    });

    test('revokeStytchSession - destroy session failure', async () => {
      const req = setupMockReq(null, true);
      utils.destroySession.mockRejectedValue(new Error('session destroy failure'));
      await auth.revokeSession(req, res, next);
      expect(stytchwrapper.revokeStytchSession).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls).toHaveLength(1);
      expect(next.mock.calls[0]).toHaveLength(1);
      expect(utils.destroySession).toBeCalled();
    });

    test('revokeStytchSession - no token', async () => {
      const req = setupMockReq(null, true);
      utils.destroySession.mockResolvedValue();
      await auth.revokeSession(req, res, next);
      expect(stytchwrapper.revokeStytchSession).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0]).toHaveLength(0);
      expect(utils.destroySession).toBeCalled();
    });

    test('revokeStytchSession - bad token', async () => {
      const req = setupMockReq('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q', true);
      stytchwrapper.revokeStytchSession.mockRejectedValue({
        status_code: 400,
        error_message: 'session_id format is invalid.',
      });
      await auth.revokeSession(req, res, next);
      expect(stytchwrapper.revokeStytchSession.mock.calls).toHaveLength(1);
      expect(next.mock.calls).toHaveLength(1);
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(utils.destroySession).not.toBeCalled();
    });
  });

  describe('authenticateUser tests', () => {
    beforeEach(() => {
      clearMockRes();
      stytchwrapper.authenticateStytchToken.mockReset();
      utils.saveSession.mockReset();
    });

    test('authenticateUser - happy path', async () => {
      const req = getMockReq({
        query: {
          token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
        },
        session: {},
      });
      stytchwrapper.authenticateStytchToken.mockResolvedValue({
        status_code: 200,
        session_token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
      });
      utils.saveSession.mockResolvedValue();
      await auth.authenticateUser(req, res, next);
      expect(stytchwrapper.authenticateStytchToken.mock.calls).toHaveLength(1);
      expect(next).toBeCalled();
      expect(next.mock.calls[0]).toHaveLength(0);
      expect(req.session.session_token).toBe('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q');
      expect(utils.saveSession).toBeCalled();
    });

    test('authenticateUser - no token', async () => {
      const req = getMockReq();
      await auth.authenticateUser(req, res, next);
      expect(next.mock.calls).toHaveLength(1);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(utils.saveSession).not.toBeCalled();
    });

    test('authenticateUser - expired/bad token', async () => {
      const req = getMockReq({
        query: {
          token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
        },
        session: {},
      });
      stytchwrapper.authenticateStytchToken.mockRejectedValue({
        status_code: 401,
        error_message: 'Magic link could not be authenticated.',
      });
      await auth.authenticateUser(req, res, next);
      expect(next.mock.calls).toHaveLength(1);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(stytchwrapper.authenticateStytchToken.mock.calls).toHaveLength(1);
      expect(utils.saveSession).not.toBeCalled();
    });

    test('authenticateUser - Good token, save failure', async () => {
      const req = getMockReq({
        query: {
          token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
        },
        session: {},
      });
      stytchwrapper.authenticateStytchToken.mockResolvedValue({
        status_code: 200,
        session_token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
      });
      utils.saveSession.mockRejectedValue(new Error('save session failure'));
      await auth.authenticateUser(req, res, next);
      expect(stytchwrapper.authenticateStytchToken.mock.calls).toHaveLength(1);
      expect(next).toBeCalled();
      expect(next.mock.calls).toHaveLength(1);
      expect(next.mock.calls[0]).toHaveLength(1);
      expect(req.session.session_token).toBe('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q');
      expect(utils.saveSession).toBeCalled();
    });
  });
});
