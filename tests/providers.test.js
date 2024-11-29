const request = require("supertest");
const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testAdminToken,
  testProviderToken,
  testUserToken
} = require("../testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Provider Routes", () => {
  describe("GET /", () => {
    test("works for logged-in users with filters", async () => {
      const filters = { specialty: "Dermatology" };

      const resp = await request(app)
        .get(`/`)
        .send(filters)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ providers: expect.any(Array) });
    });

    test("fails for unauthorized users", async () => {
      const resp = await request(app).get(`/`).send({ specialty: "Dermatology" });
      expect(resp.statusCode).toEqual(401);
    });
  });

  describe("POST /", () => {
    const newProvider = {
      account_id: 1,
      name: "Dr. Test",
      specialty: "Dermatology",
      email: "test@example.com",
      phone: "123-456-7890"
    };

    test("works for providers", async () => {
      const resp = await request(app)
        .post(`/`)
        .send(newProvider)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({ provider: expect.any(Object) });
    });

    test("fails with invalid data", async () => {
      const invalidProvider = { name: "" };
      const resp = await request(app)
        .post(`/`)
        .send(invalidProvider)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /:providerId", () => {
    const updatedData = { specialty: "Updated Specialty" };

    test("works for providers or admins", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ provider: expect.any(Object) });
    });

    test("unauthorized for other users", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(403);
    });

    test("fails with invalid data", async () => {
      const invalidData = { specialty: "" };
      const resp = await request(app)
        .patch(`/1`)
        .send(invalidData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("POST /service/:providerId", () => {
    const services = { services: [1, 2, 3] };

    test("works for providers or admins", async () => {
      const resp = await request(app)
        .post(`/service/1`)
        .send(services)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ provider: expect.any(Object) });
    });

    test("fails with invalid data", async () => {
      const invalidServices = { services: "not-an-array" };
      const resp = await request(app)
        .post(`/service/1`)
        .send(invalidServices)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("DELETE /service/:providerId", () => {
    const services = { services: [1, 2, 3] };

    test("works for providers or admins", async () => {
      const resp = await request(app)
        .delete(`/service/1`)
        .send(services)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ provider: expect.any(Object) });
    });

    test("fails with invalid data", async () => {
      const invalidServices = { services: "not-an-array" };
      const resp = await request(app)
        .delete(`/service/1`)
        .send(invalidServices)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("DELETE /:providerId", () => {
    test("works for admins", async () => {
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

    test("not found for invalid providerId", async () => {
      const resp = await request(app)
        .delete(`/9999`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
});
