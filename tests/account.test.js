const Account = require("../models/account");
const db = require("../db");
const bcrypt = require("bcrypt");
const { encrypt, decrypt } = require("../helpers/utilties");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");

jest.mock("../db");
jest.mock("bcrypt");

describe("Account Model", () => {
  describe("authenticate", () => {
    test("authenticates valid user", async () => {
      const mockAccount = {
        account_id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        phone: "1234567890",
        type: "user",
      };

      db.query.mockResolvedValueOnce({ rows: [mockAccount] });
      bcrypt.compare.mockResolvedValueOnce(true);

      const account = await Account.authenticate("test@example.com", "password123");
      expect(account).toEqual({
        account_id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        type: "user",
      });
    });

    test("throws UnauthorizedError for invalid email/password", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        Account.authenticate("wrong@example.com", "password123")
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("findAll", () => {
    test("retrieves all accounts", async () => {
      const mockAccounts = [
        { accountId: 1, name: "Test User", email: "test@example.com", phone: "1234567890", type: "user" },
      ];

      db.query.mockResolvedValueOnce({ rows: mockAccounts });

      const accounts = await Account.findAll();
      expect(accounts).toEqual(mockAccounts);
    });
  });

  describe("get", () => {
    test("retrieves account by ID", async () => {
      const mockAccount = {
        accountId: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        type: "user",
      };

      db.query.mockResolvedValueOnce({ rows: [mockAccount] });

      const account = await Account.get(1);
      expect(account).toEqual(mockAccount);
    });

    test("throws NotFoundError for invalid ID", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Account.get(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("register", () => {
    test("registers a new account", async () => {
      const mockAccount = {
        account_id: 1,
        name: "New User",
        email: "new@example.com",
        phone: "1234567890",
        type: "user",
      };

      db.query.mockResolvedValueOnce({ rows: [] });
      bcrypt.hash.mockResolvedValueOnce("hashedPassword");
      db.query.mockResolvedValueOnce({ rows: [mockAccount] });

      const account = await Account.register({
        name: "New User",
        password: "password123",
        email: "new@example.com",
        phone: "1234567890",
        type: "user",
      });

      expect(account).toEqual(mockAccount);
    });

    test("throws BadRequestError for duplicate email", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ email: "new@example.com" }] });

      await expect(
        Account.register({
          name: "New User",
          password: "password123",
          email: "new@example.com",
          phone: "1234567890",
          type: "user",
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("update", () => {
    test("updates account data", async () => {
      const mockAccount = {
        account_id: 1,
        name: "Updated User",
        email: "updated@example.com",
        phone: "9876543210",
        type: "user",
      };

      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [mockAccount] });

      const account = await Account.update(1, {
        name: "Updated User",
        email: "updated@example.com",
        phone: "9876543210",
      });

      expect(account).toEqual(mockAccount);
    });

    test("throws BadRequestError for duplicate email", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ email: "existing@example.com" }] });

      await expect(
        Account.update(1, { email: "existing@example.com" })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("remove", () => {
    test("removes account by ID", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ account_id: 1 }] });

      await Account.remove(1);

      expect(db.query).toHaveBeenCalledWith(
        `DELETE
            FROM accounts
            WHERE account_id = $1
            RETURNING account_id`,
        [1]
      );
    });

    test("throws NotFoundError for invalid ID", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Account.remove(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("findGoogleToken", () => {
    test("retrieves and decrypts Google tokens", async () => {
      const mockToken = {
        account_id: 1,
        access_token: encrypt("mockAccessToken"),
        refresh_token: encrypt("mockRefreshToken"),
        access_token_expires: "2024-01-01T00:00:00Z",
      };

      db.query.mockResolvedValueOnce({ rows: [mockToken] });

      const result = await Account.findGoogleToken(1);

      expect(result).toEqual({
        id: undefined,
        account_id: 1,
        access_token: "mockAccessToken",
        refresh_token: "mockRefreshToken",
        access_token_expires: "2024-01-01T00:00:00Z",
        refresh_token_expires: undefined,
      });
    });

    test("returns undefined if no tokens are found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await Account.findGoogleToken(1);
      expect(result).toBeUndefined();
    });
  });

  describe("updateGoogleToken", () => {
    test("updates encrypted Google tokens", async () => {
      const tokenData = {
        access_token: "newAccessToken",
        access_token_expires: "2024-01-01T00:00:00Z",
        refresh_token: "newRefreshToken",
      };

      db.query.mockResolvedValueOnce({ rows: [] });

      await Account.updateGoogleToken(1, tokenData);

      expect(db.query).toHaveBeenCalledWith(
        `UPDATE user_tokens
            SET access_token = $1, access_token_expires = $2, refresh_token = $3
            WHERE account_id = $4
            RETURNING
                account_id,
                access_token,
                refresh_token,
                access_token_expires`,
        [
          encrypt("newAccessToken"),
          "2024-01-01T00:00:00Z",
          encrypt("newRefreshToken"),
          1,
        ]
      );
    });
  });
});
