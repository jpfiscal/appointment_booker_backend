const request = require("supertest");
const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testAdminToken,
  testUserToken
} = require("../testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Google Auth and Calendar Routes", () => {

  describe("GET /google", () => {
    test("redirects to Google auth URL with userId", async () => {
      const resp = await request(app)
        .get("/google")
        .query({ userId: 1 });

      expect(resp.statusCode).toEqual(302);
      expect(resp.header.location).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    });

    test("fails without userId", async () => {
      const resp = await request(app).get("/google");

      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toEqual({ error: "Missing userId in query" });
    });
  });

  describe("GET /google/callback", () => {
    test("handles callback with valid code and state", async () => {
      // Mock OAuth2Client behavior and tokens
      const mockGetToken = jest.fn().mockResolvedValue({
        tokens: {
          access_token: "mockAccessToken",
          refresh_token: "mockRefreshToken",
          expiry_date: Date.now() + 3600 * 1000
        }
      });

      oauth2Client.getToken = mockGetToken;

      const resp = await request(app)
        .get("/google/callback")
        .query({ code: "mockCode", state: "test-state-1" });

      expect(resp.statusCode).toEqual(302);
      expect(resp.header.location).toEqual("http://localhost:5173?authSuccess=true");
      expect(mockGetToken).toHaveBeenCalled();
    });

    test("fails without state parameter", async () => {
      const resp = await request(app).get("/google/callback").query({ code: "mockCode" });

      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toEqual({ error: "Failed to authenticate with Google" });
    });
  });

  describe("POST /create-event", () => {
    const newEvent = {
      userId: 1,
      summary: "Test Event",
      description: "Test Description",
      start: "2024-12-01T10:00:00Z",
      end: "2024-12-01T11:00:00Z"
    };

    test("creates event successfully with valid token", async () => {
      // Mock token retrieval and Google API behavior
      jest.spyOn(Account, "findGoogleToken").mockResolvedValue({
        access_token: "mockAccessToken",
        refresh_token: "mockRefreshToken",
        access_token_expires: Date.now() + 3600 * 1000
      });

      jest.spyOn(calendar.events, "insert").mockResolvedValue({
        data: { id: "mockEventId", summary: "Test Event" }
      });

      const resp = await request(app)
        .post("/create-event")
        .send(newEvent);

      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ id: "mockEventId", summary: "Test Event" });
    });

    test("fails with expired token and refresh failure", async () => {
      jest.spyOn(Account, "findGoogleToken").mockResolvedValue({
        access_token: "mockAccessToken",
        refresh_token: "mockRefreshToken",
        access_token_expires: Date.now() - 3600 * 1000
      });

      jest.spyOn(oauth2Client, "refreshAccessToken").mockRejectedValue(new Error("Refresh token error"));

      const resp = await request(app)
        .post("/create-event")
        .send(newEvent);

      expect(resp.statusCode).toEqual(500);
      expect(resp.body).toEqual({ error: "Failed to refresh access token" });
    });
  });

  describe("POST /token", () => {
    test("returns JWT token for valid credentials", async () => {
      jest.spyOn(Account, "authenticate").mockResolvedValue({ id: 1, email: "test@example.com" });

      const resp = await request(app)
        .post("/token")
        .send({ email: "test@example.com", password: "password123" });

      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ token: expect.any(String) });
    });

    test("fails with invalid credentials", async () => {
      jest.spyOn(Account, "authenticate").mockRejectedValue(new Error("Invalid credentials"));

      const resp = await request(app)
        .post("/token")
        .send({ email: "wrong@example.com", password: "wrongpassword" });

      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("POST /register", () => {
    test("registers new account and returns token", async () => {
      jest.spyOn(Account, "register").mockResolvedValue({ id: 1, email: "new@example.com" });

      const resp = await request(app)
        .post("/register")
        .send({
          name: "New User",
          email: "new@example.com",
          password: "password123",
          phone: "1234567890",
          type: "user"
        });

      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({ token: expect.any(String) });
    });

    test("fails with invalid data", async () => {
      const resp = await request(app)
        .post("/register")
        .send({ email: "invalid" });

      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("GET /find-google-token/:account_id", () => {
    test("returns Google token data for valid account ID", async () => {
      jest.spyOn(Account, "findGoogleToken").mockResolvedValue({ access_token: "mockAccessToken" });

      const resp = await request(app).get("/find-google-token/1");

      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ result: { access_token: "mockAccessToken" } });
    });

    test("fails for invalid account ID", async () => {
      jest.spyOn(Account, "findGoogleToken").mockResolvedValue(null);

      const resp = await request(app).get("/find-google-token/999");

      expect(resp.statusCode).toEqual(404);
    });
  });
});
