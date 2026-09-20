/**
 * @fileoverview Tests unitarios de utilidades compartidas de Prisma.
 *
 * @module lib/prisma-utils.test
 */

import { describe, it, expect, vi } from 'vitest';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from './prisma-utils.js';

describe('prisma-utils', () => {
  describe('parseId', () => {
    it('should parse a numeric string to integer base 10', () => {
      expect(parseId('42')).toBe(42);
    });
  });

  describe('isNotFoundError', () => {
    it('should return true when error code is P2025', () => {
      expect(isNotFoundError({ code: 'P2025' })).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isNotFoundError({ code: 'P2002' })).toBe(false);
      expect(isNotFoundError(new Error('x'))).toBe(false);
    });
  });

  describe('isDuplicateError', () => {
    it('should return true when error code is P2002', () => {
      expect(isDuplicateError({ code: 'P2002' })).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isDuplicateError({ code: 'P2025' })).toBe(false);
      expect(isDuplicateError(new Error('x'))).toBe(false);
    });
  });

  describe('reorderByPosition', () => {
    it('should update each id with its index position inside a transaction', async () => {
      const update = vi.fn().mockResolvedValue({});
      const prisma = { $transaction: vi.fn((fns) => Promise.all(fns)) };
      const model = { update };

      await reorderByPosition(prisma, model, [3, 1, 2]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenNthCalledWith(1, { where: { id: 3 }, data: { position: 0 } });
      expect(update).toHaveBeenNthCalledWith(2, { where: { id: 1 }, data: { position: 1 } });
      expect(update).toHaveBeenNthCalledWith(3, { where: { id: 2 }, data: { position: 2 } });
    });
  });
});
