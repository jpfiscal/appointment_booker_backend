const Availability = require("../models/availability");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { checkDuplicates } = require("../helpers/availabilityCheck");

jest.mock("../db");
jest.mock("../helpers/availabilityCheck");

describe("Availability Model", () => {
  describe("get", () => {
    test("retrieves availabilities with filters", async () => {
      const mockAvailabilities = [
        {
          "provider name": "Test Provider",
          date: "2024-01-01",
          "start time": "09:00",
          "end time": "10:00",
          "appointment ID": null,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockAvailabilities });

      const filters = { startDate: "2024-01-01", endDate: "2024-01-31" };
      const availabilities = await Availability.get(filters);

      expect(availabilities).toEqual(mockAvailabilities);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE"), expect.any(Array));
    });

    test("throws BadRequestError for invalid date range", async () => {
      const filters = { startDate: "2024-02-01", endDate: "2024-01-01" };

      await expect(Availability.get(filters)).rejects.toThrow(BadRequestError);
    });
  });

  describe("getByService", () => {
    test("retrieves availabilities by service duration", async () => {
      const mockAvailabilities = [
        {
          "provider name": "Test Provider",
          date: "2024-01-01",
          "start time": "09:00",
          "end time": "10:00",
          "avail ID1": 1,
        },
      ];

      db.query
        .mockResolvedValueOnce({ rows: [{ service_duration: 1 }] })
        .mockResolvedValueOnce({ rows: mockAvailabilities });

      const availabilities = await Availability.getByService(1, "2024-01-01");

      expect(availabilities).toEqual(mockAvailabilities);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("throws BadRequestError for invalid service ID", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Availability.getByService(999, "2024-01-01")).rejects.toThrow(BadRequestError);
    });
  });

  describe("create", () => {
    test("creates new availabilities", async () => {
      const mockAvailabilities = [
        {
          provider_id: 1,
          date: "2024-01-01",
          start_time: "09:00",
          end_time: "10:00",
          appointment_id: null,
        },
      ];

      checkDuplicates.mockResolvedValueOnce(false);
      db.query.mockResolvedValueOnce({ rows: mockAvailabilities });

      const data = {
        availabilities: [
          { date: "2024-01-01", start_time: "09:00", end_time: "10:00" },
        ],
      };

      const availabilities = await Availability.create(data, 1);

      expect(availabilities).toEqual(mockAvailabilities);
      expect(checkDuplicates).toHaveBeenCalledWith(data, 1);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("throws BadRequestError for duplicate availabilities", async () => {
      checkDuplicates.mockResolvedValueOnce(true);

      const data = {
        availabilities: [
          { date: "2024-01-01", start_time: "09:00", end_time: "10:00" },
        ],
      };

      await expect(Availability.create(data, 1)).rejects.toThrow(BadRequestError);
    });
  });

  describe("updateBooking", () => {
    test("updates availability booking", async () => {
      const mockUpdated = [
        {
          provider_id: 1,
          date: "2024-01-01",
          start_time: "09:00",
          end_time: "10:00",
          appointment_id: 1,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockUpdated });

      const result = await Availability.updateBooking([1, 2], 1);

      expect(result).toEqual(mockUpdated);
      expect(db.query).toHaveBeenCalledWith(
        `UPDATE availabilities
             SET appointment_id = $1
             WHERE availability_id = ANY($2::integer[])
             RETURNING provider_id, date, start_time, end_time, appointment_id`,
        [1, [1, 2]]
      );
    });

    test("throws NotFoundError if no availability is updated", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Availability.updateBooking([1, 2], 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe("unbook", () => {
    test("unbooks an appointment", async () => {
      const mockUnbooked = [
        { availability_id: 1 },
      ];

      db.query.mockResolvedValueOnce({ rows: mockUnbooked });

      const result = await Availability.unbook(1);

      expect(result).toEqual(mockUnbooked);
      expect(db.query).toHaveBeenCalledWith(
        `UPDATE availabilities
            SET appointment_id = NULL
            WHERE appointment_id = $1
            RETURNING availability_id`,
        [1]
      );
    });

    test("throws BadRequestError if no availabilities are unbooked", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Availability.unbook(999)).rejects.toThrow(BadRequestError);
    });
  });

  describe("remove", () => {
    test("removes an availability", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ availability_id: 1 }] });

      await Availability.remove(1);

      expect(db.query).toHaveBeenCalledWith(
        `DELETE
            FROM availabilities
            WHERE availability_id = $1
            RETURNING availability_id`,
        [1]
      );
    });

    test("throws NotFoundError if no availability is found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Availability.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
