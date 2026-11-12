// Minimal in-memory rate limiter (no extra dependency).
// Limits each IP to `max` requests per `windowMs`.
// Note: memory is per server instance and resets on restart; for multiple
// instances use a shared store (e.g. Redis) or express-rate-limit.
const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = "Too many requests, please try again later",
} = {}) => {
  const hits = new Map(); // ip -> { count, resetAt }

  // Drop expired entries so the map doesn't grow forever.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref(); // don't keep the process alive just for this timer

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, message });
    }

    next();
  };
};

module.exports = rateLimit;
