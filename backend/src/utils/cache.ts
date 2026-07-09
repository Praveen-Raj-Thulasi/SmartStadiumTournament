let cache: {
  consolidated: unknown;
  matches: unknown;
  incidents: unknown;
  staff: unknown;
} = {
  consolidated: null,
  matches: null,
  incidents: null,
  staff: null
};

let cacheTimes = {
  consolidated: 0,
  matches: 0,
  incidents: 0,
  staff: 0
};

const CACHE_TTL_MS = 3000; // Cache duration of 3 seconds

export const getCached = (key: keyof typeof cache): unknown => {
  const now = Date.now();
  if (cache[key] && (now - cacheTimes[key] < CACHE_TTL_MS)) {
    return cache[key];
  }
  return null;
};

export const setCached = (key: keyof typeof cache, data: unknown): void => {
  cache[key] = data;
  cacheTimes[key] = Date.now();
};

export const invalidateCache = () => {
  cache.consolidated = null;
  cache.matches = null;
  cache.incidents = null;
  cache.staff = null;
  cacheTimes.consolidated = 0;
  cacheTimes.matches = 0;
  cacheTimes.incidents = 0;
  cacheTimes.staff = 0;
};
