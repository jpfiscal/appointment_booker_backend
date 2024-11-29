const Service = require("../models/service");
const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

jest.mock("../db");

describe("Service Model", () => {
  describe("getAll", () => {
    test("retrieves all services", async () => {
      const mockServices = [
        {
          service_id: 1,
          service_name: "Test Service",
          service_group: "Group A",
          service_desc: "A test service",
          service_price: 100,
          service_duration: 1,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockServices });

      const services = await Service.getAll();

      expect(services).toEqual(mockServices);
      expect(db.query).toHaveBeenCalledWith("SELECT *\n                    FROM services\n                    ORDER BY service_group");
    });

    test("throws NotFoundError if no services found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Service.getAll()).rejects.toThrow(NotFoundError);
    });
  });

  describe("get", () => {
    test("retrieves a single service by ID", async () => {
      const mockService = {
        service_id: 1,
        service_name: "Test Service",
        service_group: "Group A",
        service_desc: "A test service",
        service_price: 100,
        service_duration: 1,
      };

      db.query.mockResolvedValueOnce({ rows: [mockService] });

      const service = await Service.get(1);

      expect(service).toEqual(mockService);
      expect(db.query).toHaveBeenCalledWith(
        "SELECT * \n                    FROM services\n                    WHERE service_id = $1",
        [1]
      );
    });

    test("throws NotFoundError if service not found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Service.get(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    test("creates a new service", async () => {
      const mockService = {
        service_name: "Test Service",
        service_group: "Group A",
      };

      db.query.mockResolvedValueOnce({ rows: [mockService] });

      const data = {
        service_name: "Test Service",
        service_group: "Group A",
        service_desc: "A test service",
        service_price: 100,
        service_duration: 1,
      };

      const newService = await Service.create(data);

      expect(newService).toEqual(mockService);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO services"),
        expect.any(Array)
      );
    });
  });

  describe("update", () => {
    test("updates an existing service", async () => {
      const mockService = {
        service_id: 1,
        service_name: "Updated Service",
        service_group: "Updated Group",
        service_desc: "Updated description",
        service_price: 150,
        service_duration: 2,
      };

      db.query.mockResolvedValueOnce({ rows: [mockService] });

      const data = {
        service_name: "Updated Service",
        service_price: 150,
      };

      const updatedService = await Service.update(1, data);

      expect(updatedService).toEqual(mockService);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE services SET"),
        expect.arrayContaining(["Updated Service", 150, 1])
      );
    });

    test("throws NotFoundError if service not found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const data = { service_name: "Updated Service" };

      await expect(Service.update(999, data)).rejects.toThrow(NotFoundError);
    });
  });

  describe("remove", () => {
    test("removes a service", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ service_id: 1 }] });

      await Service.remove(1);

      expect(db.query).toHaveBeenCalledWith(
        `DELETE
               FROM services
               WHERE service_id = $1
               RETURNING service_id`,
        [1]
      );
    });

    test("throws NotFoundError if service not found", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Service.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
