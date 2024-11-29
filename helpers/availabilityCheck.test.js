const { checkDuplicates } = require("../models/availability");
const db = require("../db");

jest.mock("../db"); // Mock the database

describe("Availability Functions", () => {
  describe("checkDuplicates", () => {
    test("returns true if duplicates exist", async () => {
      const mockData = {
        availabilities: [
          { date: "2024-01-01", start_time: "09:00" },
          { date: "2024-01-02", start_time: "10:00" },
        ],
      };

      db.query.mockResolvedValueOnce({
        rows: [{ availability_id: 1 }],
      });

      const result = await checkDuplicates(mockData, 1);
      expect(result).toBe(true);

      expect(db.query).toHaveBeenCalledWith(
        `SELECT availability_id
                    FROM availabilities
                    WHERE provider_id = $1
                    AND date = ANY($2::date[])
                    AND start_time = ANY($3::time[])`,
        [
          1,
          ["2024-01-01", "2024-01-02"],
          ["09:00", "10:00"],
        ]
      );
    });

    test("returns false if no duplicates exist", async () => {
      const mockData = {
        availabilities: [
          { date: "2024-01-01", start_time: "09:00" },
          { date: "2024-01-02", start_time: "10:00" },
        ],
      };

      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await checkDuplicates(mockData, 1);
      expect(result).toBe(false);
    });

    test("handles empty input data", async () => {
      const mockData = { availabilities: [] };

      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await checkDuplicates(mockData, 1);
      expect(result).toBe(false);

      expect(db.query).toHaveBeenCalledWith(
        `SELECT availability_id
                    FROM availabilities
                    WHERE provider_id = $1
                    AND date = ANY($2::date[])
                    AND start_time = ANY($3::time[])`,
        [1, [], []]
      );
    });

    test("throws an error if the database query fails", async () => {
      const mockData = {
        availabilities: [
          { date: "2024-01-01", start_time: "09:00" },
        ],
      };

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await expect(checkDuplicates(mockData, 1)).rejects.toThrow("Database error");
    });
  });
});
