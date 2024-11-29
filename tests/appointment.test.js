const Appointment = require("../models/appointment");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Availability = require("../models/availability");

jest.mock("../db");
jest.mock("../models/availability");

describe("Appointment Model", () => {
  describe("getAll", () => {
    test("retrieves all appointments with filters", async () => {
      const mockAppointments = [
        {
          appointment_id: 1,
          "Client Name": "Test Client",
          "Service Name": "Test Service",
          "Provider Name": "Test Provider",
          "client note": "Test Note",
          date: "2024-01-01",
          time: "09:00",
          status: "booked",
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockAppointments });

      const filters = { client_id: 1 };
      const appointments = await Appointment.getAll(filters);

      expect(appointments).toEqual(mockAppointments);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE"), expect.any(Array));
    });

    test("retrieves all appointments without filters", async () => {
      const mockAppointments = [
        {
          appointment_id: 1,
          "Client Name": "Test Client",
          "Service Name": "Test Service",
          "Provider Name": "Test Provider",
          "client note": "Test Note",
          date: "2024-01-01",
          time: "09:00",
          status: "booked",
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockAppointments });

      const appointments = await Appointment.getAll();

      expect(appointments).toEqual(mockAppointments);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("GROUP BY"), []);
    });
  });

  describe("create", () => {
    test("creates a new appointment", async () => {
      const mockAppointment = {
        appointment_id: 1,
        "client name": "Test Client",
        "service name": "Test Service",
        "provider name": "Test Provider",
        date: "2024-01-01",
        "start time": "09:00",
        "duration (hrs)": 2,
        status: "booked",
      };

      db.query
        .mockResolvedValueOnce({ rows: [] }) // Availability check
        .mockResolvedValueOnce({ rows: [{ appointment_id: 1 }] }) // Insert appointment
        .mockResolvedValueOnce({ rows: [mockAppointment] }); // Retrieve appointment

      Availability.updateBooking.mockResolvedValueOnce();

      const data = {
        client_id: 1,
        service_id: 1,
        availabilities: [1, 2],
        client_note: "Test Note",
      };

      const appointment = await Appointment.create(data);

      expect(appointment).toEqual(mockAppointment);
      expect(db.query).toHaveBeenCalledTimes(3);
      expect(Availability.updateBooking).toHaveBeenCalledWith([1, 2], 1);
    });

    test("throws BadRequestError if availability is already booked", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ availability_id: 1 }] });

      const data = {
        client_id: 1,
        service_id: 1,
        availabilities: [1, 2],
        client_note: "Test Note",
      };

      await expect(Appointment.create(data)).rejects.toThrow(BadRequestError);
    });
  });

  describe("update", () => {
    test("updates an appointment", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ appointment_id: 1 }] }) // Update query
        .mockResolvedValueOnce({ rows: [{
          appointment_id: 1,
          "Client Name": "Updated Client",
          "Service Name": "Updated Service",
          "Provider Name": "Updated Provider",
          date: "2024-01-02",
          time: "10:00",
          status: "rescheduled",
        }] }); // Retrieve appointment

      const data = { status: "rescheduled" };
      const appointment = await Appointment.update(1, data);

      expect(appointment).toEqual([
        {
          appointment_id: 1,
          "Client Name": "Updated Client",
          "Service Name": "Updated Service",
          "Provider Name": "Updated Provider",
          date: "2024-01-02",
          time: "10:00",
          status: "rescheduled",
        },
      ]);
    });

    test("throws NotFoundError if appointment does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const data = { status: "rescheduled" };

      await expect(Appointment.update(999, data)).rejects.toThrow(NotFoundError);
    });
  });

  describe("cancel", () => {
    test("cancels an appointment", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ appointment_id: 1 }] });
      Availability.unbook.mockResolvedValueOnce();

      const result = await Appointment.cancel(1);

      expect(result).toBe("appointment ID 1 has been successfully cancelled.");
      expect(db.query).toHaveBeenCalledWith(
        `UPDATE appointments
            SET status = 'cancelled'
            WHERE appointment_id = $1
            RETURNING appointment_id, availability_id`,
        [1]
      );
      expect(Availability.unbook).toHaveBeenCalledWith(1);
    });

    test("throws NotFoundError if appointment does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Appointment.cancel(999)).rejects.toThrow(NotFoundError);
    });
  });
});
