import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
    password: string,
    salt: Buffer,
    keyLength: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const FORMAT = 'scrypt';

/**
 * Hash to store in the database: "scrypt:<salt>:<key>" (both in hex).
 * The salt is random and different for every password, so two users with the same
 * password get different hashes.
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await scryptAsync(password, salt, KEY_LENGTH);
    return `${FORMAT}:${salt.toString('hex')}:${key.toString('hex')}`;
}

/** True if the password produces the stored hash. Never throws on a malformed hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [format, saltHex, keyHex] = stored.split(':');
    if (format !== FORMAT || !saltHex || !keyHex) {
        return false;
    }
    const expected = Buffer.from(keyHex, 'hex');
    if (expected.length !== KEY_LENGTH) {
        return false;
    }
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
    // The comparison is done in constant time, therefore the time taken does not reveal how many bytes matched
    return timingSafeEqual(actual, expected);
}

/** A valid hash of no real password: used to do the same work when the email does not exist. */
export const DUMMY_HASH = `${FORMAT}:${'00'.repeat(16)}:${'00'.repeat(KEY_LENGTH)}`;