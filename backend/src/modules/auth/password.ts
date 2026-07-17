import argon2 from "argon2";
import bcrypt from "bcryptjs";

/**
 * Argon2id parameters. MUST match CoreMap so hashes written here are readable by
 * CoreMap and vice versa.
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"];

export interface VerifyResult {
  valid: boolean;
  /** True when a valid legacy/stale hash should be transparently upgraded to Argon2id. */
  needsRehash: boolean;
}

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}

function isBcryptHash(hash: string): boolean {
  return BCRYPT_PREFIXES.some((prefix) => hash.startsWith(prefix));
}

/**
 * Verify a plaintext password against a stored hash.
 *
 * - Argon2id hashes verify with argon2; `needsRehash` is set when the stored
 *   parameters are weaker than the current policy.
 * - Legacy bcrypt hashes ($2a/$2b/$2y) verify with bcryptjs and always signal
 *   `needsRehash` so the caller can upgrade them to Argon2id.
 * - Malformed / unsupported hashes never authenticate.
 */
export async function verifyPassword(
  storedHash: string,
  plain: string,
): Promise<VerifyResult> {
  if (!storedHash) {
    return { valid: false, needsRehash: false };
  }

  if (isArgon2Hash(storedHash)) {
    try {
      const valid = await argon2.verify(storedHash, plain);
      if (!valid) {
        return { valid: false, needsRehash: false };
      }
      return { valid: true, needsRehash: argon2.needsRehash(storedHash, ARGON2_OPTIONS) };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  if (isBcryptHash(storedHash)) {
    try {
      const valid = await bcrypt.compare(plain, storedHash);
      return { valid, needsRehash: valid };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  return { valid: false, needsRehash: false };
}
