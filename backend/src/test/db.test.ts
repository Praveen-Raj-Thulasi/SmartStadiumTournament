import { describe, it, expect, beforeEach } from 'vitest';
import { getCached, setCached, invalidateCache } from '../utils/cache';

describe('Database Caching Utility Tests', () => {
  beforeEach(() => {
    invalidateCache();
  });

  it('should return null when cache key is empty or expired', () => {
    expect(getCached('matches')).toBeNull();
    expect(getCached('incidents')).toBeNull();
    expect(getCached('staff')).toBeNull();
  });

  it('should persist and retrieve cached data within active TTL', () => {
    const mockMatches = [{ id: 1, team1: 'A', team2: 'B' }];
    setCached('matches', mockMatches);

    const retrieved = getCached('matches');
    expect(retrieved).toEqual(mockMatches);
  });

  it('should invalidate cache when invalidateCache is explicitly invoked', () => {
    const mockIncidents = [{ id: 'inc-1', status: 'open' }];
    setCached('incidents', mockIncidents);

    expect(getCached('incidents')).toEqual(mockIncidents);

    invalidateCache();
    expect(getCached('incidents')).toBeNull();
  });
});
