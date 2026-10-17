/**
 * Luzzio OmniCore — Client-side Form Validation Helpers
 * Mirrors server/utils/validate.js so errors show instantly without a round-trip.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+\-()]{7,20}$/;

export const isBlank    = (v) => v === undefined || v === null || String(v).trim() === '';
export const isPositive = (v) => { const n = Number(v); return !isNaN(n) && isFinite(n) && n > 0; };
export const isNonNeg   = (v) => { const n = Number(v); return !isNaN(n) && isFinite(n) && n >= 0; };
export const isInt      = (v, min = 0) => { const n = Number(v); return !isNaN(n) && Number.isInteger(n) && n >= min; };
export const isEmail    = (v) => typeof v === 'string' && EMAIL_RE.test(v.trim());
export const isPhone    = (v) => typeof v === 'string' && PHONE_RE.test(v.trim());

/**
 * Run a list of validation rules.
 * Rules: [{ condition: boolean, message: string }]
 * Returns first failing message or null.
 */
export const firstError = (rules) => {
   for (const r of rules) {
      if (r.condition) return r.message;
   }
   return null;
};
