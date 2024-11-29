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

describe("Appointment Routes", () => {
  describe("GET /", () => {
    test("works for logged-in users", async () => {
      const resp = await request(app)
        .get(`/`)
        .set("authorization", `Bearer ${testUserToken}`)
        .query({ booking_dt_start: "2024-01-01", booking_dt_end: "2024-12-31" });
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ appointments: expect.any(Array) });
    });

    test("fails if date range is invalid", async () => {
      const resp = await request(app)
        .get(`/`)
        .set("authorization", `Bearer ${testUserToken}`)
        .query({ booking_dt_start: "2024-12-31", booking_dt_end: "2024-01-01" });
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("POST /", () => {
    const newAppointment = {
      client_id: 1,
      service_id: 1,
      availability_ids: [1, 2],
      client_note: "Looking forward to this appointment."
    };

    test("works for admin", async () => {
      const resp = await request(app)
        .post(`/`)
        .send(newAppointment)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ appointment: expect.any(Object) });
    });

    test("fails with invalid data", async () => {
      const invalidAppointment = { client_id: "invalid" };
      const resp = await request(app)
        .post(`/`)
        .send(invalidAppointment)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /:appointmentId", () => {
    const updatedData = { service_id: 2, client_note: "Updated note" };

    test("works for correct user or admin", async () => {
      const resp = await request(app)
        .patch(`/1`)
        .send(updatedData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ appointment: expect.any(Object) });
    });

    test("fails with invalid data", async () => {
      const invalidData = { service_id: "not-a-number" };
      const resp = await request(app)
        .patch(`/1`)
        .send(invalidData)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  describe("PATCH /cancel/:appointmentId", () => {
    test("works for correct user or admin", async () => {
      const resp = await request(app)
        .patch(`/cancel/1`)
        .set("authorization", `Bearer ${testAdminToken}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({ result: expect.any(Object) });
    });

    test("unauthorized for others", async () => {
      const resp = await request(app)
        .patch(`/cancel/1`)
        .set("authorization", `Bearer ${testUserToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  });
});
