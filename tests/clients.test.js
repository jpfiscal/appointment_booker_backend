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

describe("Client Routes", () => {
  describe("GET /", () => {
    test("works for logged-in users with filters", async () => {
      const resp = await request(app)
        .get(`/`)
        .query({ city: "Toronto" })
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ clients: expect.any(Array) });
    });

    test("fails for unauthorized users", async () => {
      const resp = await request(app).get(`/`).query({ city: "Toronto" });
      expect(resp.statusCode).toEqual(401);
    });
  });

  describe("POST /", () => {
    const newClient = {
      account_id: 1,
      gender: "female",
      birthday: "1990-01-01",
      address: "123 Main St",
      city: "Toronto",
      state: "ON"
    };

    test("works for logged-in users", async () => {
      const resp = await request(app)
        .post(`/`)
        .send(newClient)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({ clients: expect.any(Object) });
    });

    test("fails with invalid data", async () => {
      const invalidClient = { account_id: "not-a-number" };
      const resp = await request(app)
        .post(`/`)
        .send(invalidClient)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /:clientId", () => {
    const updatedData = {
      gender: "male",
      city: "Vancouver"
    };

    test("works for admin or correct user", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ client: expect.any(Object) });
    });

    test("unauthorized for other users", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(403);
    });

    test("fails with invalid data", async () => {
      const invalidData = { birthday: "invalid-date" };
      const resp = await request(app)
        .patch(`/1`)
        .send(invalidData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("DELETE /:clientId", () => {
    test("works for admin or correct user", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ deleted: "1" });
    });

    test("unauthorized for other users", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(403);
    });

    test("not found for invalid clientId", async () => {
      const resp = await request(app)
        .delete(`/9999`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
});
