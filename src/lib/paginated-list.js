/**
 * @fileoverview Factory de handlers de listado paginado.
 *
 * Genera handlers de Express que listan recursos de Prisma con
 * paginación (`?page`/`?limit`) y respuesta `{ data, meta }`,
 * eliminando la duplicación entre los listados admin.
 *
 * @module lib/paginated-list
 * @requires lib/pagination
 * @requires lib/http-response
 * @requires services/logger
 */

import logger from '../services/logger.js';
import { sendPaginated, sendInternalError } from './http-response.js';
import { parsePagination, buildPaginationMeta } from './pagination.js';

/**
 * Crea un handler de Express que lista recursos paginados.
 *
 * @param {Object} options - Opciones del handler
 * @param {Object} options.model - Modelo de Prisma (debe exponer findMany y count)
 * @param {Object} [options.findManyArgs] - Argumentos adicionales de findMany (orderBy, include, select, where)
 * @param {Function} [options.serialize] - Transforma cada elemento antes de responder
 * @param {string} options.errorMessage - Contexto del error para el log
 * @returns {Function} Handler de Express (req, res) => Promise<Object>
 */
const createPaginatedListHandler = ({ model, findManyArgs = {}, serialize, errorMessage }) => {
  return async (req, res) => {
    try {
      const { page, limit, skip } = parsePagination(req.query);

      const [items, total] = await Promise.all([
        model.findMany({ skip, take: limit, ...findManyArgs }),
        model.count(),
      ]);

      const data = serialize ? items.map(serialize) : items;

      return sendPaginated(res, data, buildPaginationMeta(total, page, limit));
    } catch (error) {
      return sendInternalError(res, logger, errorMessage, error);
    }
  };
};

export { createPaginatedListHandler };
