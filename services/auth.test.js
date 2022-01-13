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
    authenticateUser: jest.fn(),
  };
});

const { res, next, clearMockRes } = getMockRes({});

describe('auth tests', () => {
  beforeEach(() => {
    clearMockRes();
    stytchwrapper.authenticateUser.mockReset();
  });

  test('authorizeUser - no token', async () => {
    const req = getMockReq();
    await auth.authorizeUser(req, res, next);
    expect(next).not.toBeCalled();
    expect(res.status).toBeCalledWith(401);
  });

  test('authorizeUser - expired/bad token', async () => {
    const req = getMockReq({
      query: {
        token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
      },
    });
    stytchwrapper.authenticateUser.mockRejectedValue({
      status_code: 401,
      error_message: 'Magic link could not be authenticated.',
    });
    await auth.authorizeUser(req, res, next);
    expect(next).not.toBeCalled();
    expect(res.status).toBeCalledWith(401);
    expect(stytchwrapper.authenticateUser.mock.calls).toHaveLength(1);
  });

  test('authorizeUser - rejected promise - really bad error', async () => {
    const req = getMockReq({
      query: {
        token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
      },
    });
    stytchwrapper.authenticateUser.mockRejectedValue(new Error('Unknown Error'));
    await auth.authorizeUser(req, res, next);
    expect(stytchwrapper.authenticateUser.mock.calls).toHaveLength(1);
    expect(next).not.toBeCalled();
    expect(res.status).toBeCalled();
  });

  test('authorizeUser - Good token', async () => {
    const req = getMockReq({
      query: {
        token: 'mZAYn5aLEqKUlZ_Ad9U_fWr38GaAQ1oFAhT8ds245v7Q',
      },
    });
    stytchwrapper.authenticateUser.mockResolvedValue({
      status_code: 200,
    });
    await auth.authorizeUser(req, res, next);
    expect(next).toBeCalled();
    expect(stytchwrapper.authenticateUser.mock.calls).toHaveLength(1);
  });
});
