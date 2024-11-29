const jwt = require("jsonwebtoken");
const { createToken, getTokens, storeTokens } = require("./tokens");
const { encrypt, decrypt } = require("./utilties");
const db = require("../db");
const { SECRET_KEY } = require("../config");

jest.mock("../db"); // Mock the database

describe("Token Functions", () => {
  describe("createToken", () => {
    test("creates a valid JWT", () => {
      const user = {
        account_id: 1,
        email: "test@example.com",
        type: "user",
        username: "testuser",
        isAdmin: true,
      };

      const token = createToken(user);
      const payload = jwt.verify(token, SECRET_KEY);

      expect(payload).toEqual(
        expect.objectContaining({
          accountId: 1,
          email: "test@example.com",
          type: "user",
          username: "testuser",
          isAdmin: true,
        })
      );
    });

    test("defaults isAdmin to false if not provided", () => {
      const user = {
        account_id: 1,
        email: "test@example.com",
        type: "user",
        username: "testuser",
      };

      const token = createToken(user);
      const payload = jwt.verify(token, SECRET_KEY);

      expect(payload.isAdmin).toBe(false);
    });
  });

  describe("getTokens", () => {
    test("retrieves and returns decrypted tokens", async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            access_token: encrypt("mockAccessToken"),
            refresh_token: encrypt("mockRefreshToken"),
          },
        ],
      });

      const tokens = await getTokens(1);

      expect(tokens).toEqual({
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      });
    });

    test("throws an error if no tokens are found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(getTokens(1)).rejects.toThrow("No tokens found for this user.");
    });
  });

  describe("storeTokens", () => {
    test("encrypts and stores tokens in the database", async () => {
      const userId = 1;
      const accessToken = "mockAccessToken";
      const refreshToken = "mockRefreshToken";
      const expiryDate = "2024-01-01 12:00:00";

      await storeTokens(userId, accessToken, refreshToken, expiryDate);

      expect(db.query).toHaveBeenCalledWith(
        `INSERT INTO user_tokens (account_id, access_token, refresh_token, access_token_expires) \
         VALUES ($1, $2, $3, $4) \
         ON CONFLICT (account_id) DO UPDATE \
         SET access_token = $2, refresh_token = $3, access_token_expires = $4, updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          encrypt(accessToken),
          encrypt(refreshToken),
          expiryDate,
        ]
      );
    });
  });
});
