import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from '../../src/utils/date';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Set fake time to 2024-12-14 12:00:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "just now" for times less than 60 seconds ago', () => {
    const date = new Date('2024-12-14T11:59:30Z'); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('should return "1 minute ago" for exactly 1 minute', () => {
    const date = new Date('2024-12-14T11:59:00Z'); // 1 minute ago
    expect(formatRelativeTime(date)).toBe('1 minute ago');
  });

  it('should return "N minutes ago" for multiple minutes', () => {
    const date = new Date('2024-12-14T11:45:00Z'); // 15 minutes ago
    expect(formatRelativeTime(date)).toBe('15 minutes ago');
  });

  it('should return "1 hour ago" for exactly 1 hour', () => {
    const date = new Date('2024-12-14T11:00:00Z'); // 1 hour ago
    expect(formatRelativeTime(date)).toBe('1 hour ago');
  });

  it('should return "N hours ago" for multiple hours', () => {
    const date = new Date('2024-12-14T09:00:00Z'); // 3 hours ago
    expect(formatRelativeTime(date)).toBe('3 hours ago');
  });

  it('should return "1 day ago" for exactly 1 day', () => {
    const date = new Date('2024-12-13T12:00:00Z'); // 1 day ago
    expect(formatRelativeTime(date)).toBe('1 day ago');
  });

  it('should return "N days ago" for multiple days', () => {
    const date = new Date('2024-12-10T12:00:00Z'); // 4 days ago
    expect(formatRelativeTime(date)).toBe('4 days ago');
  });

  it('should return "1 week ago" for exactly 1 week', () => {
    const date = new Date('2024-12-07T12:00:00Z'); // 7 days ago
    expect(formatRelativeTime(date)).toBe('1 week ago');
  });

  it('should return "N weeks ago" for multiple weeks', () => {
    const date = new Date('2024-11-30T12:00:00Z'); // 14 days = 2 weeks ago
    expect(formatRelativeTime(date)).toBe('2 weeks ago');
  });

  it('should return "1 month ago" for approximately 1 month', () => {
    const date = new Date('2024-11-14T12:00:00Z'); // 30 days ago
    expect(formatRelativeTime(date)).toBe('1 month ago');
  });

  it('should return "N months ago" for multiple months', () => {
    const date = new Date('2024-09-14T12:00:00Z'); // ~91 days = 3 months ago
    expect(formatRelativeTime(date)).toBe('3 months ago');
  });

  it('should return "1 year ago" for approximately 1 year', () => {
    const date = new Date('2023-12-14T12:00:00Z'); // 365 days ago
    expect(formatRelativeTime(date)).toBe('1 year ago');
  });

  it('should return "N years ago" for multiple years', () => {
    const date = new Date('2022-12-14T12:00:00Z'); // 730 days = 2 years ago
    expect(formatRelativeTime(date)).toBe('2 years ago');
  });

  it('should handle edge case at boundary between minutes and hours', () => {
    const date = new Date('2024-12-14T11:00:30Z'); // 59 minutes 30 seconds ago
    expect(formatRelativeTime(date)).toBe('59 minutes ago');
  });

  it('should handle edge case at boundary between hours and days', () => {
    const date = new Date('2024-12-13T12:30:00Z'); // 23 hours 30 minutes ago
    expect(formatRelativeTime(date)).toBe('23 hours ago');
  });

  it('should handle edge case at boundary between days and weeks', () => {
    const date = new Date('2024-12-08T12:00:00Z'); // 6 days ago
    expect(formatRelativeTime(date)).toBe('6 days ago');
  });

  it('should handle edge case at boundary between weeks and months', () => {
    const date = new Date('2024-11-21T12:00:00Z'); // 23 days ago (3 weeks)
    expect(formatRelativeTime(date)).toBe('3 weeks ago');
  });

  it('should handle edge case at boundary between months and years', () => {
    const date = new Date('2024-02-14T12:00:00Z'); // ~304 days = 10 months ago
    expect(formatRelativeTime(date)).toBe('10 months ago');
  });
});
