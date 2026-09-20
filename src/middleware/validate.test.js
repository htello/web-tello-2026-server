/**
 * @fileoverview Tests unitarios del middleware de validación.
 *
 * Cubre los schemas de actualización (`.min(1)`) para garantizar que
 * devuelven un mensaje en español cuando el body está vacío.
 *
 * @module middleware/validate.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validate,
  paintingUpdateSchema,
  exhibitionUpdateSchema,
  designUpdateSchema,
  illustrationUpdateSchema,
} from './validate.js';

describe('HU - Validate Middleware (schemas de actualización)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  const updateSchemas = [
    ['paintingUpdateSchema', paintingUpdateSchema],
    ['exhibitionUpdateSchema', exhibitionUpdateSchema],
    ['designUpdateSchema', designUpdateSchema],
    ['illustrationUpdateSchema', illustrationUpdateSchema],
  ];

  describe.each(updateSchemas)('%s', (_name, schema) => {
    it('should return 400 with Spanish message when body is empty', () => {
      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Debe enviar al menos un campo para actualizar',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
