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
import { sendPaginated, sendError, sendInternalError } from './http-response.js';
import { parsePagination, buildPaginationMeta } from './pagination.js';

/**
 * Crea un handler de Express que lista recursos paginados.
 *
 * @param {Object} options - Opciones del handler
 * @param {Object} options.model - Modelo de Prisma (debe exponer findMany y count)
 * @param {Object} [options.findManyArgs] - Argumentos adicionales de findMany (orderBy, include, select, where)
 * @param {(query: Object) => (Object|string)} [options.buildWhere] - Construye el `where` de la query.
 *   Devuelve un objeto de filtrado (o `{}`) o un string con el mensaje de error de validación (→ 400).
 * @param {Function} [options.serialize] - Transforma cada elemento antes de responder
 * @param {string} options.errorMessage - Contexto del error para el log
 * @returns {Function} Handler de Express (req, res) => Promise<Object>
 */
const createPaginatedListHandler = ({ model, findManyArgs = {}, buildWhere, serialize, errorMessage }) => {
  return async (req, res) => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const { where: baseWhere, ...restArgs } = findManyArgs;
      const filter = buildWhere ? buildWhere(req.query) : {};
      if (typeof filter === 'string') {
        return sendError(res, 400, 'VALIDATION_ERROR', filter);
      }
      const where = { ...baseWhere, ...filter };
      const hasWhere = Object.keys(where).length > 0;

      const [items, total] = await Promise.all([
        hasWhere
          ? model.findMany({ skip, take: limit, ...restArgs, where })
          : model.findMany({ skip, take: limit, ...restArgs }),
        hasWhere ? model.count({ where }) : model.count(),
      ]);

      const data = serialize ? items.map(serialize) : items;

      return sendPaginated(res, data, buildPaginationMeta(total, page, limit));
    } catch (error) {
      return sendInternalError(res, logger, errorMessage, error);
    }
  };
};

export { createPaginatedListHandler };
