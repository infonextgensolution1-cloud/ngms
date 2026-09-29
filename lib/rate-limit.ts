// Best-effort in-memory limiter (per serverless instance). Enough to blunt
// casual form abuse; real protection is the honeypot + email validation.
const hits = new Map<string, number[]>()

export function rateLimit(key: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    hits.set(key, arr)
    return false
  }
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 5000) hits.clear()
  return true
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export const isEmail = (s: unknown): s is string =>
  typeof s === 'string' && s.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(s)
