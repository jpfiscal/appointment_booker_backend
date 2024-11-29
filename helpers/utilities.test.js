const { convertToDateTime, encrypt, decrypt } = require("./utilties");
const crypto = require("crypto");
const { ENCRYPTION_KEY } = process.env;

describe("Utility Functions", () => {
  describe("convertToDateTime", () => {
    test("converts a valid timestamp to UTC datetime string", () => {
      const timestamp = Date.UTC(2024, 0, 1, 12, 0, 0); // January 1, 2024, 12:00:00 UTC
      const result = convertToDateTime(timestamp);
      expect(result).toEqual("2024-01-01 12:00:00");
    });

    test("handles invalid timestamps", () => {
      expect(() => convertToDateTime("invalid"))
        .toThrow();
    });
  });

  describe("encrypt and decrypt", () => {
    test("encrypts and decrypts correctly", () => {
      const plainText = "This is a test";
      const encrypted = encrypt(plainText);
      expect(encrypted).toEqual(expect.any(String));

      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(plainText);
    });

    test("fails to decrypt with incorrect input", () => {
      const invalidEncryptedText = "invalid:data";
      expect(() => decrypt(invalidEncryptedText)).toThrow();
    });

    test("encryption produces different outputs for the same input", () => {
      const plainText = "This is a test";
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);
      expect(encrypted1).not.toEqual(encrypted2);
    });

    test("decrypted text matches original input", () => {
      const plainText = "Sensitive information";
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(plainText);
    });
  });
});
