const stytchwrapper = require('./stytchwrapper');
const auth = require('./auth');
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
  jest.spyOn(console, 'log').mockImplementation(() => {});
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
    });

    test('revokeStytchSession - happy path', async () => {
      const req = setupMockReq('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q', true);
      stytchwrapper.revokeStytchSession.mockResolvedValue({});
      await auth.revokeSession(req, res, next);
      expect(next).toBeCalled();
      expect(req.session.destroy).toBeCalled();
    });

    test('revokeStytchSession - no token', async () => {
      const req = setupMockReq(null, true);
      await auth.revokeSession(req, res, next);
      expect(stytchwrapper.revokeStytchSession).not.toBeCalled();
      expect(next).toBeCalled();
      expect(req.session.destroy).toBeCalled();
    });

    test('revokeStytchSession - bad token', async () => {
      const req = setupMockReq('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q', true);
      stytchwrapper.revokeStytchSession.mockRejectedValue({
        status_code: 400,
        error_message: 'session_id format is invalid.',
      });
      await auth.revokeSession(req, res, next);
      expect(stytchwrapper.revokeStytchSession.mock.calls).toHaveLength(1);
      expect(res.status).toBeCalledWith(400);
      expect(next).not.toBeCalled();
      expect(req.session.destroy).not.toBeCalled();
    });
  });

  describe('authenticateUser tests', () => {
    beforeEach(() => {
      clearMockRes();
      stytchwrapper.authenticateStytchToken.mockReset();
    });

    test('authenticateUser - no token', async () => {
      const req = getMockReq();
      await auth.authenticateUser(req, res, next);
      expect(next).not.toBeCalled();
      expect(res.status).toBeCalledWith(401);
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
      expect(next).not.toBeCalled();
      expect(res.status).toBeCalledWith(401);
      expect(stytchwrapper.authenticateStytchToken.mock.calls).toHaveLength(1);
    });

    test('authenticateUser - Good token', async () => {
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
      await auth.authenticateUser(req, res, next);
      expect(stytchwrapper.authenticateStytchToken.mock.calls).toHaveLength(1);
      expect(next).toBeCalled();
      expect(req.session.session_token).toBe('mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q');
    });
  });
});
