/**
 * @fileoverview Tests unitarios del servicio de logging.
 *
 * @module services/logger.test
 */

import { describe, it, expect } from 'vitest';
import { logFormat } from './logger.js';

describe('Logger', () => {
  it('should format log without metadata', () => {
    const formatted = logFormat.transform({
      level: 'info',
      message: 'Mensaje simple',
      timestamp: '2024-01-01 00:00:00',
    });

    expect(formatted[Symbol.for('message')]).toBe(
      '2024-01-01 00:00:00 info: Mensaje simple '
    );
  });

  it('should format log with metadata', () => {
    const formatted = logFormat.transform({
      level: 'info',
      message: 'Mensaje con meta',
      timestamp: '2024-01-01 00:00:00',
      userId: 1,
    });

    const message = formatted[Symbol.for('message')];
    expect(message).toContain('Mensaje con meta');
    expect(message).toContain('"userId":1');
  });
});
