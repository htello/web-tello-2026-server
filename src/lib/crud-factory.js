/**
 * @fileoverview Factorías de handlers CRUD compartidos entre recursos.
 *
 * Centraliza la lógica repetida en los controladores de recursos con
 * imagen (pinturas, ilustraciones, proyectos de diseño): reorder,
 * listados simples, detalle por ID y create/update/remove con gestión
 * de imágenes en Cloudinary.
 *
 * @module lib/crud-factory
 * @requires lib/prisma
 * @requires lib/prisma-utils
 * @requires lib/http-response
 * @requires lib/constants
 * @requires services/upload
 * @requires services/cloudinary
 * @requires services/logger
 */

import prisma from './prisma.js';
import logger from '../services/logger.js';
import { resolveImageAsset } from '../services/upload.js';
import { deleteCloudinaryImage, extractPublicId } from '../services/cloudinary.js';
import { parseId, isNotFoundError, isDuplicateError, reorderByPosition } from './prisma-utils.js';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendDuplicate,
  sendInternalError,
} from './http-response.js';
import {
  IMAGE_REQUIRED_MESSAGE,
  REORDER_SUCCESS_MESSAGE,
  REORDER_INVALID_IDS_MESSAGE,
} from './constants.js';

/**
 * Resuelve el public_id de Cloudinary a partir del asset subido o de la URL.
 *
 * @param {Object} imageAsset - Resultado de resolveImageAsset ({ url, publicId })
 * @param {string|null|undefined} url - URL final de la imagen
 * @returns {string|null} public_id o null si no está disponible
 */
const resolveImagePublicId = (imageAsset, url) => imageAsset.publicId || extractPublicId(url);

/**
 * Construye el fragmento de datos `{ imagePublicId }` solo si hay public_id.
 *
 * @param {Object} imageAsset - Resultado de resolveImageAsset
 * @param {string|null|undefined} url - URL final de la imagen
 * @returns {Object} `{}` o `{ imagePublicId: string }`
 */
const imagePublicIdField = (imageAsset, url) => {
  const publicId = resolveImagePublicId(imageAsset, url);
  return publicId ? { imagePublicId: publicId } : {};
};

/**
 * Crea el handler PUT /reorder (asigna position según orderedIds).
 *
 * @param {Object} options - Opciones
 * @param {Object} options.model - Delegate de Prisma (p.ej. prisma.painting)
 * @param {string} options.logLabel - Mensaje del logger al reordenar
 * @param {string} options.errorMessage - Contexto del error para el log
 * @returns {Function} Handler de Express (req, res) => Promise<Object>
 */
const createReorderHandler = ({ model, logLabel, errorMessage }) => async (req, res) => {
  try {
    const { orderedIds } = req.body;

    await reorderByPosition(prisma, model, orderedIds);

    logger.info(logLabel, { count: orderedIds.length });

    return sendSuccess(res, { message: REORDER_SUCCESS_MESSAGE });
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendValidationError(res, REORDER_INVALID_IDS_MESSAGE);
    }
    return sendInternalError(res, logger, errorMessage, error);
  }
};

/**
 * Crea un handler GET que lista recursos con `findMany`.
 *
 * @param {Object} options - Opciones
 * @param {Object} options.model - Delegate de Prisma
 * @param {Object} options.args - Argumentos de findMany (where, orderBy, include)
 * @param {string} options.errorMessage - Contexto del error para el log
 * @param {Function} [options.serialize] - Transforma cada elemento antes de responder
 * @returns {Function} Handler de Express
 */
const createFindManyHandler = ({ model, args, errorMessage, serialize }) => async (_req, res) => {
  try {
    const items = await model.findMany(args);

    return sendSuccess(res, serialize ? items.map(serialize) : items);
  } catch (error) {
    return sendInternalError(res, logger, errorMessage, error);
  }
};

/**
 * Crea un handler GET /:id basado en `findUnique`.
 *
 * @param {Object} options - Opciones
 * @param {Object} options.model - Delegate de Prisma
 * @param {Object} [options.args] - Argumentos extra de findUnique (include)
 * @param {string} options.notFoundMessage - Mensaje del 404
 * @param {string} options.errorMessage - Contexto del error para el log
 * @returns {Function} Handler de Express
 */
const createGetByIdHandler = ({ model, args = {}, notFoundMessage, errorMessage }) => async (req, res) => {
  try {
    const item = await model.findUnique({
      where: { id: parseId(req.params.id) },
      ...args,
    });

    if (!item) return sendNotFound(res, notFoundMessage);

    return sendSuccess(res, item);
  } catch (error) {
    return sendInternalError(res, logger, errorMessage, error);
  }
};

/**
 * Crea los handlers POST/PUT/DELETE para un recurso con imagen.
 *
 * La imagen se resuelve con `resolveImageAsset` (archivo subido o URL del
 * body) y las imágenes reemplazadas/eliminadas se borran de Cloudinary.
 *
 * @param {Object} options - Opciones
 * @param {Object} options.model - Delegate de Prisma del recurso
 * @param {string} options.section - Subcarpeta de Cloudinary (pintura, ilustracion, diseno)
 * @param {(ctx: Object) => Promise<Object|null>} [options.validateCreate] - Validación
 *   extra del create (p.ej. existencia de colección). Recibe `{ req, res }` y devuelve
 *   una respuesta ya enviada para abortar, o null para continuar.
 * @param {(ctx: Object) => Object} options.buildCreateData - Construye `data` del create.
 *   Recibe `{ body, imageAsset, finalImageUrl }`.
 * @param {(ctx: Object) => Object} options.buildUpdateData - Construye `data` del update.
 *   Recibe `{ body, imageAsset, finalImageUrl }`.
 * @param {Object} options.labels - Textos del recurso
 * @param {string} options.labels.created - Log al crear (p.ej. 'Pintura creada')
 * @param {string} options.labels.updated - Log al actualizar
 * @param {string} options.labels.removed - Log al eliminar
 * @param {string} options.labels.notFound - Mensaje 404 (update/remove)
 * @param {string} options.labels.removedMessage - Mensaje de éxito del remove
 * @param {string} options.labels.duplicate - Mensaje 400 por título duplicado
 * @param {string} options.labels.createError - Contexto de error del create
 * @param {string} options.labels.updateError - Contexto de error del update
 * @param {string} options.labels.removeError - Contexto de error del remove
 * @returns {{ create: Function, update: Function, remove: Function }} Handlers de Express
 */
const createImageResourceHandlers = ({
  model,
  section,
  validateCreate,
  buildCreateData,
  buildUpdateData,
  labels,
}) => {
  const create = async (req, res) => {
    try {
      const imageAsset = await resolveImageAsset(req.file, req.body.imageUrl, section);
      const finalImageUrl = imageAsset.url;

      if (!finalImageUrl) {
        return sendValidationError(res, IMAGE_REQUIRED_MESSAGE);
      }

      if (validateCreate) {
        const earlyResponse = await validateCreate({ req, res });
        if (earlyResponse) return earlyResponse;
      }

      const created = await model.create({
        data: buildCreateData({ body: req.body, imageAsset, finalImageUrl }),
      });

      logger.info(labels.created, { id: created.id, title: created.title });

      return sendSuccess(res, created, 201);
    } catch (error) {
      if (isDuplicateError(error)) {
        return sendDuplicate(res, labels.duplicate);
      }
      return sendInternalError(res, logger, labels.createError, error);
    }
  };

  const update = async (req, res) => {
    try {
      const { id } = req.params;
      const imageAsset = await resolveImageAsset(req.file, req.body.imageUrl, section);
      const finalImageUrl = imageAsset.url;

      if (Object.prototype.hasOwnProperty.call(req.body, 'imageUrl') && !req.file && !finalImageUrl) {
        return sendValidationError(res, IMAGE_REQUIRED_MESSAGE);
      }

      if (finalImageUrl) {
        const previous = await model.findUnique({
          where: { id: parseId(id) },
          select: { imageUrl: true, imagePublicId: true },
        });

        if (previous && previous.imageUrl !== finalImageUrl) {
          await deleteCloudinaryImage(previous.imagePublicId, previous.imageUrl);
        }
      }

      const updated = await model.update({
        where: { id: parseId(id) },
        data: buildUpdateData({ body: req.body, imageAsset, finalImageUrl }),
      });

      logger.info(labels.updated, { id: updated.id });

      return sendSuccess(res, updated);
    } catch (error) {
      if (isNotFoundError(error)) return sendNotFound(res, labels.notFound);
      if (isDuplicateError(error)) return sendDuplicate(res, labels.duplicate);
      return sendInternalError(res, logger, labels.updateError, error);
    }
  };

  const remove = async (req, res) => {
    try {
      const recordId = parseId(req.params.id);

      const existing = await model.findUnique({
        where: { id: recordId },
        select: { imageUrl: true, imagePublicId: true },
      });

      if (!existing) {
        return sendNotFound(res, labels.notFound);
      }

      await deleteCloudinaryImage(existing.imagePublicId, existing.imageUrl);

      await model.delete({ where: { id: recordId } });

      logger.info(labels.removed, { id: recordId });

      return sendSuccess(res, { message: labels.removedMessage });
    } catch (error) {
      if (isNotFoundError(error)) return sendNotFound(res, labels.notFound);
      return sendInternalError(res, logger, labels.removeError, error);
    }
  };

  return { create, update, remove };
};

export {
  resolveImagePublicId,
  imagePublicIdField,
  createReorderHandler,
  createFindManyHandler,
  createGetByIdHandler,
  createImageResourceHandlers,
};
