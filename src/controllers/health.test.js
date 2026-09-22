/**
 * @fileoverview Tests unitarios del controller de health checks.
 *
 * Cubre GET /api/v1/health/db: comprobación de conectividad
 * con la base de datos.
 *
 * @module controllers/health.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { dbCheck } = await import('./health.js');
const logger = (await import('../services/logger.js')).default;

describe('Health - dbCheck', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('given database is reachable', () => {
    it('should return 200 with db up', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      await dbCheck(req, res);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          status: 'ok',
          db: 'up',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('given database is unreachable', () => {
    it('should return 503 SERVICE_UNAVAILABLE', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      await dbCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Base de datos no disponible',
        code: 'SERVICE_UNAVAILABLE',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
