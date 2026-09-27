/**
 * @fileoverview Tests unitarios del helper de paginación.
 *
 * @module lib/pagination.test
 */

import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginationMeta } from './pagination.js';

describe('lib/pagination', () => {
  describe('parsePagination', () => {
    it('should return defaults when query is empty', () => {
      expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should return defaults when query is undefined', () => {
      expect(parsePagination()).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should parse page and limit and compute skip', () => {
      expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    it('should cap limit at 100', () => {
      expect(parsePagination({ page: '1', limit: '500' })).toEqual({ page: 1, limit: 100, skip: 0 });
    });

    it('should clamp page to minimum 1', () => {
      expect(parsePagination({ page: '0', limit: '20' })).toEqual({ page: 1, limit: 20, skip: 0 });
      expect(parsePagination({ page: '-3' })).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should clamp limit to minimum 1', () => {
      expect(parsePagination({ limit: '-5' })).toEqual({ page: 1, limit: 1, skip: 0 });
      expect(parsePagination({ limit: '0' })).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should fall back to defaults on non-numeric values', () => {
      expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 20, skip: 0 });
    });
  });

  describe('buildPaginationMeta', () => {
    it('should compute pages from total and limit', () => {
      expect(buildPaginationMeta(45, 2, 20)).toEqual({ total: 45, page: 2, limit: 20, pages: 3 });
    });

    it('should return 0 pages when total is 0', () => {
      expect(buildPaginationMeta(0, 1, 20)).toEqual({ total: 0, page: 1, limit: 20, pages: 0 });
    });
  });
});
