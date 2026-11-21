import crypto from 'node:crypto';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 32, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, SCRYPT_PARAMS);
  return crypto.timingSafeEqual(expected, actual);
}

export function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// Kindvriendelijke wachtwoorden: een muziekwoord met twee cijfers, bv. "gitaar42".
const PASSWORD_WORDS = [
  'gitaar', 'drums', 'piano', 'viool', 'trompet', 'fluit', 'harp', 'banjo', 'cello', 'tuba',
  'ritme', 'melodie', 'koor', 'podium', 'concert', 'noot', 'akkoord', 'refrein', 'beat', 'disco',
];

export function kidPassword() {
  const word = PASSWORD_WORDS[crypto.randomInt(PASSWORD_WORDS.length)];
  return `${word}${crypto.randomInt(10, 100)}`;
}

// Klascodes zonder verwarrende tekens (geen 0/O, 1/I/L).
const CODE_WORDS = ['BAS', 'DRUM', 'SOLO', 'BEAT', 'POP', 'JAZZ', 'ROCK', 'HARP', 'TUBA', 'KOOR'];
export function classCode() {
  return `${CODE_WORDS[crypto.randomInt(CODE_WORDS.length)]}-${crypto.randomInt(23, 99)}${'ABCDEFGHJKMNPQRSTUVWXYZ'[crypto.randomInt(23)]}`;
}

/** Eenvoudige rem op inlogpogingen (in geheugen). */
export class RateLimiter {
  constructor({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
    this.max = max;
    this.windowMs = windowMs;
    this.map = new Map();
  }
  blocked(key) {
    const e = this.map.get(key);
    if (!e) return false;
    if (Date.now() > e.reset) { this.map.delete(key); return false; }
    return e.count >= this.max;
  }
  fail(key) {
    const now = Date.now();
    const e = this.map.get(key);
    if (!e || now > e.reset) this.map.set(key, { count: 1, reset: now + this.windowMs });
    else e.count += 1;
    if (this.map.size > 10000) {
      for (const [k, v] of this.map) if (now > v.reset) this.map.delete(k);
    }
  }
  clear(key) {
    this.map.delete(key);
  }
}
