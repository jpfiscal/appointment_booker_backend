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

describe("Service Routes", () => {
  describe("GET /", () => {
    test("works for logged-in users", async () => {
      const resp = await request(app)
        .get(`/`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual(expect.any(Array));
    });

    test("unauthorized for anonymous users", async () => {
      const resp = await request(app).get(`/`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  describe("GET /:service_id", () => {
    test("works for logged-in users", async () => {
      const resp = await request(app)
        .get(`/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ result: expect.any(Object) });
    });

    test("not found for invalid service_id", async () => {
      const resp = await request(app)
        .get(`/9999`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });

  describe("POST /", () => {
    const newService = {
      service_name: "Test Service",
      service_group: "Test Group",
      service_desc: "Description of Test Service",
      service_price: 100,
      service_duration: 60
    };

    test("works for admin", async () => {
      const resp = await request(app)
        .post(`/`)
        .send(newService)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({ newService: expect.any(Object) });
    });

    test("unauthorized for non-admins", async () => {
      const resp = await request(app)
        .post(`/`)
        .send(newService)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(403);
    });

    test("fails with invalid data", async () => {
      const invalidService = { service_name: "" };
      const resp = await request(app)
        .post(`/`)
        .send(invalidService)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /:service_id", () => {
    const updatedData = {
      service_name: "Updated Service Name",
      service_price: 120
    };

    test("works for admin", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ service: expect.any(Object) });
    });

    test("unauthorized for non-admins", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(403);
    });

    test("fails with invalid data", async () => {
      const invalidData = { service_price: "not-a-number" };
      const resp = await request(app)
        .patch(`/1`)
        .send(invalidData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("DELETE /:service_id", () => {
    test("works for admin", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ deleted: "1" });
    });

    test("unauthorized for non-admins", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(403);
    });

    test("not found for invalid service_id", async () => {
      const resp = await request(app)
        .delete(`/9999`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
});
