const request = require("supertest");
const app = require("../app"); // Import your Express app
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, testAdminToken, testUserToken } = require("../testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("User Routes", () => {
  describe("GET /", () => {
    test("works for admin", async () => {
      const resp = await request(app)
        .get(`/`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ users: expect.any(Array) });
    });

    test("unauthorized for non-admin", async () => {
      const resp = await request(app)
        .get(`/`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  describe("GET /:accountId", () => {
    test("works for correct user or admin", async () => {
      const resp = await request(app)
        .get(`/1`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ account: expect.any(Object) });
    });

    test("unauthorized for others", async () => {
      const resp = await request(app)
        .get(`/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  describe("POST /", () => {
    const newAccount = {
      name: "Test User",
      email: "test@example.com",
      phone: "123-456-7890",
      type: "user",
      password: "password123",
    };

    test("works for admin", async () => {
      const resp = await request(app)
        .post(`/`)
        .send(newAccount)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        account: expect.objectContaining({
          name: newAccount.name,
          email: newAccount.email,
        }),
        token: expect.any(String),
      });
    });

    test("fails with invalid data", async () => {
      const invalidAccount = { name: "" };
      const resp = await request(app)
        .post(`/`)
        .send(invalidAccount)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /:accountId", () => {
    const updatedData = { name: "Updated Name" };

    test("works for correct user or admin", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ account: expect.objectContaining(updatedData) });
    });

    test("fails with invalid data", async () => {
      const invalidData = { email: "not-an-email" };
      const resp = await request(app)
        .patch(`/1`)
        .send(invalidData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("DELETE /:accountId", () => {
    test("works for correct user or admin", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ account: expect.any(Object) });
    });

    test("unauthorized for others", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  });
});
