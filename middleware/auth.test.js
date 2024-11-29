const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureProvider,
  ensureProviderOrAdmin,
  ensureCorrectUserOrAdmin,
} = require("./middleware");
const { SECRET_KEY } = require("../config");

describe("Middleware Tests", () => {
  describe("authenticateJWT", () => {
    test("works with a valid token", () => {
      const req = { headers: { authorization: `Bearer ${jwt.sign({ username: "test" }, SECRET_KEY)}` } };
      const res = { locals: {} };
      const next = jest.fn();

      authenticateJWT(req, res, next);
      expect(res.locals.user).toEqual({ username: "test", iat: expect.any(Number) });
      expect(next).toHaveBeenCalled();
    });

    test("skips with no token", () => {
      const req = { headers: {} };
      const res = { locals: {} };
      const next = jest.fn();

      authenticateJWT(req, res, next);
      expect(res.locals.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    test("skips with an invalid token", () => {
      const req = { headers: { authorization: "Bearer invalid-token" } };
      const res = { locals: {} };
      const next = jest.fn();

      authenticateJWT(req, res, next);
      expect(res.locals.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("ensureLoggedIn", () => {
    test("passes if user is logged in", () => {
      const req = {};
      const res = { locals: { user: { username: "test" } } };
      const next = jest.fn();

      ensureLoggedIn(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("fails if user is not logged in", () => {
      const req = {};
      const res = { locals: {} };
      const next = jest.fn();

      ensureLoggedIn(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe("ensureAdmin", () => {
    test("passes if user is admin", () => {
      const req = {};
      const res = { locals: { user: { isAdmin: true } } };
      const next = jest.fn();

      ensureAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("fails if user is not admin", () => {
      const req = {};
      const res = { locals: { user: { isAdmin: false } } };
      const next = jest.fn();

      ensureAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe("ensureProvider", () => {
    test("passes if user is provider", () => {
      const req = {};
      const res = { locals: { user: { isProvider: true } } };
      const next = jest.fn();

      ensureProvider(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("fails if user is not provider", () => {
      const req = {};
      const res = { locals: { user: { isProvider: false } } };
      const next = jest.fn();

      ensureProvider(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe("ensureProviderOrAdmin", () => {
    test("passes if user is provider or admin", () => {
      const req = {};
      const res = { locals: { user: { isProvider: true } } };
      const next = jest.fn();

      ensureProviderOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();

      res.locals.user = { isAdmin: true };
      ensureProviderOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("fails if user is neither provider nor admin", () => {
      const req = {};
      const res = { locals: { user: { isProvider: false, isAdmin: false } } };
      const next = jest.fn();

      ensureProviderOrAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe("ensureCorrectUserOrAdmin", () => {
    test("passes if user matches or is admin", () => {
      const req = { params: { username: "test" } };
      const res = { locals: { user: { username: "test", isAdmin: false } } };
      const next = jest.fn();

      ensureCorrectUserOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();

      res.locals.user = { username: "other", isAdmin: true };
      ensureCorrectUserOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test("fails if user does not match and is not admin", () => {
      const req = { params: { username: "test" } };
      const res = { locals: { user: { username: "other", isAdmin: false } } };
      const next = jest.fn();

      ensureCorrectUserOrAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
