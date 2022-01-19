const { getMockReq } = require('@jest-mock/express');
const { isEmpty, isArray, isObject, saveSession, destroySession } = require('./utils');

describe('utils Tests', () => {
  describe('is Tests', () => {
    test('isArray tests', async () => {
      expect(isArray()).toBeFalsy(); // false
      expect(isArray(null)).toBeFalsy(); // false
      expect(isArray(true)).toBeFalsy(); // false
      expect(isArray(1)).toBeFalsy(); // false
      expect(isArray('str')).toBeFalsy(); // false
      expect(isArray({})).toBeFalsy(); // false
      expect(isArray(new Date())).toBeFalsy(); // false
      expect(isArray([])).toBeTruthy(); // true
    });
    test('isObject tests', async () => {
      expect(isObject()).toBeFalsy(); // false
      expect(isObject(null)).toBeFalsy(); // false
      expect(isObject(true)).toBeFalsy(); // false
      expect(isObject(1)).toBeFalsy(); // false
      expect(isObject('str')).toBeFalsy(); // false
      expect(isObject([])).toBeFalsy(); // false
      expect(isObject(new Date())).toBeFalsy(); // false
      expect(isObject({})).toBeTruthy(); // true
    });
    test('isEmpty tests', async () => {
      expect(isEmpty()).toBeFalsy(); // false
      expect(isEmpty(null)).toBeFalsy(); // false
      expect(isEmpty(true)).toBeFalsy(); // false
      expect(isEmpty(1)).toBeFalsy(); // false
      expect(isEmpty('str')).toBeFalsy(); // false
      expect(isEmpty([])).toBeFalsy(); // false
      expect(isEmpty(new Date())).toBeFalsy(); // false
      expect(isEmpty({ a: 1 })).toBeFalsy(); // false
      expect(isEmpty({})).toBeTruthy(); // true
      expect(isEmpty('')).toBeTruthy(); // true
    });
  });

  describe('session helper Tests', () => {
    test('save session reject', async () => {
      const req = getMockReq({
        session: {
          save: jest.fn().mockImplementation((callback) => {
            callback(new Error('save failure'));
          }),
        },
      });
      await expect(saveSession(req)).rejects.toThrowError('save failure');
      expect(req.session.save).toBeCalled();
    });

    test('save session resolve', async () => {
      const req = getMockReq({
        session: {
          save: jest.fn().mockImplementation((callback) => {
            callback();
          }),
        },
      });
      await expect(saveSession(req)).resolves.toBe();
      expect(req.session.save).toBeCalled();
    });

    test('destroy session reject', async () => {
      const req = getMockReq({
        session: {
          destroy: jest.fn().mockImplementation((callback) => {
            callback(new Error('destroy failure'));
          }),
        },
      });
      await expect(destroySession(req)).rejects.toThrowError('destroy failure');
      expect(req.session.destroy).toBeCalled();
    });

    test('destroy session resolve', async () => {
      const req = getMockReq({
        session: {
          destroy: jest.fn().mockImplementation((callback) => {
            callback();
          }),
        },
      });
      await expect(destroySession(req)).resolves.toBe();
      expect(req.session.destroy).toBeCalled();
    });
  });
});
