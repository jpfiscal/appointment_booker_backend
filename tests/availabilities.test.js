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

describe("Availability Routes", () => {
  describe("GET /", () => {
    test("works for providers with valid filters", async () => {
      const filters = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        providerId: 1
      };

      const resp = await request(app)
        .get(`/`)
        .send(filters)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ availabilities: expect.any(Array) });
    });

    test("fails for invalid filters", async () => {
      const filters = { startDate: "not-a-date" };

      const resp = await request(app)
        .get(`/`)
        .send(filters)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("GET /service/:serviceId", () => {
    test("works for logged-in users", async () => {
      const resp = await request(app)
        .get(`/service/1`)
        .query({ date: "2024-01-15" })
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ availabilities: expect.any(Array) });
    });

    test("fails for missing date query", async () => {
      const resp = await request(app)
        .get(`/service/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("POST /:providerId", () => {
    const newAvailability = [
      { date: "2024-01-20", start_time: "09:00", end_time: "11:00" },
      { date: "2024-01-21", start_time: "13:00", end_time: "15:00" }
    ];

    test("works for providers", async () => {
      const resp = await request(app)
        .post(`/1`)
        .send(newAvailability)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({ availability: expect.any(Array) });
    });

    test("fails for invalid data", async () => {
      const invalidAvailability = [{ date: "invalid-date" }];

      const resp = await request(app)
        .post(`/1`)
        .send(invalidAvailability)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /:appointmentId", () => {
    const updatedData = { start_time: "10:00", end_time: "12:00" };

    test("works for providers", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ availability: expect.any(Object) });
    });

    test("fails for invalid data", async () => {
      const invalidData = { start_time: "invalid-time" };

      const resp = await request(app)
        .patch(`/1`)
        .send(invalidData)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("DELETE /:availabilityId", () => {
    test("works for providers", async () => {
      const resp = await request(app)
        .delete(`/1`)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ availability: "1" });
    });

    test("not found for invalid availabilityId", async () => {
      const resp = await request(app)
        .delete(`/9999`)
        .set("authorization", `Bearer ${testProviderToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
});
