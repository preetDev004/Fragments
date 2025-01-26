import crypto from "crypto";

/**
 * @param {string} email user's email address
 * @returns string Hashed email address
 */
const hash = (email: string): string => {
  return crypto.createHash("sha256").update(email).digest("hex");
}

export default hash;
