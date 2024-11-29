const Provider = require("../models/provider");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

jest.mock("../db");

describe("Provider Model", () => {
  describe("getAll", () => {
    test("retrieves providers with filters", async () => {
      const mockProviders = [
        {
          provider_id: 1,
          name: "Test Provider",
          specialty: "Test Specialty",
          email: "provider@example.com",
          phone: "123-456-7890",
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockProviders });

      const filters = { specialty: "Test Specialty" };
      const providers = await Provider.getAll(filters);

      expect(providers).toEqual(mockProviders);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE"), expect.any(Array));
    });

    test("retrieves all providers without filters", async () => {
      const mockProviders = [
        {
          provider_id: 1,
          name: "Test Provider",
          specialty: "Test Specialty",
          email: "provider@example.com",
          phone: "123-456-7890",
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockProviders });

      const providers = await Provider.getAll();

      expect(providers).toEqual(mockProviders);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("ORDER BY name"), []);
    });
  });

  describe("create", () => {
    test("creates a new provider", async () => {
      const mockProvider = {
        provider_id: 1,
        account_id: 1,
        specialty: "Test Specialty",
        provider_desc: "Test Description",
      };

      db.query
        .mockResolvedValueOnce({ rows: [{ account_id: 1 }] }) // Account exists
        .mockResolvedValueOnce({ rows: [] }) // No existing provider for account
        .mockResolvedValueOnce({ rows: [mockProvider] }); // Insert provider

      const data = {
        account_id: 1,
        specialty: "Test Specialty",
        provider_desc: "Test Description",
      };

      const provider = await Provider.create(data);

      expect(provider).toEqual(mockProvider);
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    test("throws NotFoundError if account does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const data = {
        account_id: 1,
        specialty: "Test Specialty",
        provider_desc: "Test Description",
      };

      await expect(Provider.create(data)).rejects.toThrow(NotFoundError);
    });

    test("throws BadRequestError if provider already exists for account", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ account_id: 1 }] }) // Account exists
        .mockResolvedValueOnce({ rows: [{ provider_id: 1 }] }); // Existing provider for account

      const data = {
        account_id: 1,
        specialty: "Test Specialty",
        provider_desc: "Test Description",
      };

      await expect(Provider.create(data)).rejects.toThrow(BadRequestError);
    });
  });

  describe("update", () => {
    test("updates an existing provider", async () => {
      const mockProvider = {
        provider_id: 1,
        account_id: 1,
        specialty: "Updated Specialty",
        provider_desc: "Updated Description",
      };

      db.query.mockResolvedValueOnce({ rows: [mockProvider] });

      const data = { specialty: "Updated Specialty", provider_desc: "Updated Description" };
      const provider = await Provider.update(1, data);

      expect(provider).toEqual(mockProvider);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE providers SET"),
        expect.arrayContaining(["Updated Specialty", "Updated Description", 1])
      );
    });

    test("throws NotFoundError if provider does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const data = { specialty: "Updated Specialty" };

      await expect(Provider.update(999, data)).rejects.toThrow(NotFoundError);
    });
  });

  describe("addService", () => {
    test("adds services to provider", async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // No duplicate services

      const services = { services: [1, 2] };
      const result = await Provider.addService(1, services);

      expect(result).toEqual("service ID(s) added for provider ID 1: (1, 2)");
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO service_provider"),
        expect.arrayContaining([1, 1, 1, 2])
      );
    });

    test("throws BadRequestError if services already linked", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ service_provider_id: 1 }] });

      const services = { services: [1, 2] };

      await expect(Provider.addService(1, services)).rejects.toThrow(BadRequestError);
    });
  });

  describe("removeService", () => {
    test("removes services from provider", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ service_id: 1 }, { service_id: 2 }] }); // Services linked

      const services = { services: [1, 2] };
      const result = await Provider.removeService(1, services);

      expect(result).toEqual("service ID(s) removed for provider ID 1: (1, 2)");
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM service_provider"),
        expect.any(Array)
      );
    });

    test("throws BadRequestError if services not linked", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ service_id: 3 }] }); // Different services linked

      const services = { services: [1, 2] };

      await expect(Provider.removeService(1, services)).rejects.toThrow(BadRequestError);
    });
  });

  describe("remove", () => {
    test("removes a provider", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ provider_id: 1 }] }) // Provider exists
        .mockResolvedValueOnce({ rows: [{ provider_id: 1 }] }); // Provider deleted

      await Provider.remove(1);

      expect(db.query).toHaveBeenCalledWith(
        `SELECT provider_id
            FROM providers
            WHERE provider_id = $1`,
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        `DELETE
            FROM providers
            WHERE provider_id = $1`,
        [1]
      );
    });

    test("throws NotFoundError if provider does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Provider.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
