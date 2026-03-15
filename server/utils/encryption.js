import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts sensitive text using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format iv:content:authTag
 */
export function encrypt(text) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-character string.");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(encryptionKey), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypts sensitive text using AES-256-GCM
 * @param {string} encryptedText - The encrypted text in format iv:content:authTag
 * @returns {string} - Decrypted text
 */
export function decrypt(encryptedText) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-character string.");
  }

  const [ivHex, encryptedHex, authTagHex] = encryptedText.split(":");
  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error("Invalid encrypted text format.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(encryptionKey), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
