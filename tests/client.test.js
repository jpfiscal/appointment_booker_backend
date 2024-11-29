const Client = require("../models/client");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

jest.mock("../db");

describe("Client Model", () => {
  describe("getAll", () => {
    test("retrieves clients with filters", async () => {
      const mockClients = [
        {
          client_id: 1,
          account_id: 1,
          name: "Test Client",
          gender: "male",
          birthday: "1990-01-01",
          address: "123 Main St",
          city: "Test City",
          state: "Test State",
          email: "test@example.com",
          phone: "123-456-7890",
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockClients });

      const filters = { city: "Test City" };
      const clients = await Client.getAll(filters);

      expect(clients).toEqual(mockClients);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE"), expect.any(Array));
    });

    test("retrieves all clients without filters", async () => {
      const mockClients = [
        {
          client_id: 1,
          account_id: 1,
          name: "Test Client",
          gender: "male",
          birthday: "1990-01-01",
          address: "123 Main St",
          city: "Test City",
          state: "Test State",
          email: "test@example.com",
          phone: "123-456-7890",
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockClients });

      const clients = await Client.getAll();

      expect(clients).toEqual(mockClients);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("ORDER BY name"), []);
    });

    test("throws BadRequestError for invalid date range", async () => {
      const filters = { birthdayFrom: "2024-01-01", birthdayTo: "2023-01-01" };

      await expect(Client.getAll(filters)).rejects.toThrow(BadRequestError);
    });
  });

  describe("create", () => {
    test("creates a new client", async () => {
      const mockClient = {
        client_id: 1,
        account_id: 1,
        gender: "male",
        birthday: "1990-01-01",
        address: "123 Main St",
        city: "Test City",
        state: "Test State",
      };

      db.query
        .mockResolvedValueOnce({ rows: [{ account_id: 1 }] }) // Account exists
        .mockResolvedValueOnce({ rows: [] }) // No existing client for account
        .mockResolvedValueOnce({ rows: [mockClient] }); // Insert client

      const data = {
        account_id: 1,
        gender: "male",
        birthday: "1990-01-01",
        address: "123 Main St",
        city: "Test City",
        state: "Test State",
      };

      const client = await Client.create(data);

      expect(client).toEqual(mockClient);
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    test("throws NotFoundError if account does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const data = {
        account_id: 1,
        gender: "male",
        birthday: "1990-01-01",
        address: "123 Main St",
        city: "Test City",
        state: "Test State",
      };

      await expect(Client.create(data)).rejects.toThrow(NotFoundError);
    });

    test("throws BadRequestError if client already exists for account", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ account_id: 1 }] }) // Account exists
        .mockResolvedValueOnce({ rows: [{ client_id: 1 }] }); // Existing client for account

      const data = {
        account_id: 1,
        gender: "male",
        birthday: "1990-01-01",
        address: "123 Main St",
        city: "Test City",
        state: "Test State",
      };

      await expect(Client.create(data)).rejects.toThrow(BadRequestError);
    });
  });

  describe("update", () => {
    test("updates an existing client", async () => {
      const mockClient = {
        client_id: 1,
        gender: "female",
        birthday: "1995-01-01",
        address: "456 Elm St",
        city: "New City",
        state: "New State",
      };

      db.query.mockResolvedValueOnce({ rows: [mockClient] });

      const data = { city: "New City", state: "New State" };
      const client = await Client.update(1, data);

      expect(client).toEqual(mockClient);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE clients SET"),
        expect.arrayContaining(["New City", "New State", 1])
      );
    });

    test("throws NotFoundError if client does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const data = { city: "New City" };

      await expect(Client.update(999, data)).rejects.toThrow(NotFoundError);
    });
  });

  describe("remove", () => {
    test("removes a client", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ client_id: 1 }] }) // Client exists
        .mockResolvedValueOnce({ rows: [{ client_id: 1 }] }); // Client deleted

      await Client.remove(1);

      expect(db.query).toHaveBeenCalledWith(
        `SELECT client_id
            FROM clients
            WHERE client_id = $1`,
        [1]
      );
      expect(db.query).toHaveBeenCalledWith(
        `DELETE
            FROM clients
            WHERE client_id = $1`,
        [1]
      );
    });

    test("throws NotFoundError if client does not exist", async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(Client.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
