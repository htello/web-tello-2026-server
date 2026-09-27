/**
 * @fileoverview Helper de paginación para endpoints de listado.
 *
 * Centraliza el parseo de `page`/`limit` de la query y la construcción
 * del objeto `meta` devuelto por `sendPaginated`.
 *
 * @module lib/pagination
 * @requires lib/constants
 */

import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MIN_LIMIT,
  PAGINATION_MAX_LIMIT,
} from './constants.js';

/**
 * Parsea los parámetros de paginación de la query.
 *
 * Valores no numéricos o ausentes caen a los defaults;
 * `page` se limita a >= 1 y `limit` al rango [1, 100].
 *
 * @param {Object} [query] - Query del request (req.query)
 * @param {string|number} [query.page] - Número de página (default 1)
 * @param {string|number} [query.limit] - Elementos por página (default 20, max 100)
 * @returns {{ page: number, limit: number, skip: number }} Parámetros normalizados
 */
const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query?.page, 10) || PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_PAGE);
  const parsedLimit = Number.parseInt(query?.limit, 10) || PAGINATION_DEFAULT_LIMIT;
  const limit = Math.min(Math.max(parsedLimit, PAGINATION_MIN_LIMIT), PAGINATION_MAX_LIMIT);

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Construye el objeto `meta` de una respuesta paginada.
 *
 * @param {number} total - Número total de elementos
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @returns {{ total: number, page: number, limit: number, pages: number }} Meta de paginación
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

export { parsePagination, buildPaginationMeta };
