import { describe, it, expect, vi } from 'vitest';

/**
 * Demonstrates the hermetic isolation pattern for unit tests.
 * Rules: no real network, no real disk I/O, no real global timers.
 */
describe('Template Example Test', () => {
  it('should demonstrate hermetic isolation', () => {
    const data = { status: 'ok' };
    expect(data.status).toBe('ok');
  });

  it('should use deterministic timers', () => {
    vi.useFakeTimers();
    let val = 0;
    setTimeout(() => {
      val = 1;
    }, 1000);
    vi.advanceTimersByTime(1000);
    expect(val).toBe(1);
    vi.useRealTimers();
  });
});
