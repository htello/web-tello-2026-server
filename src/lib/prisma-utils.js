/**
 * @fileoverview Utilidades compartidas para operaciones con Prisma.
 *
 * Centraliza helpers repetidos en los controladores: parseo de IDs,
 * detección de errores por código y reordenamiento por posición.
 *
 * @module lib/prisma-utils
 */

/**
 * Convierte un ID de ruta (string) a entero en base 10.
 *
 * @param {string} value - ID proveniente de req.params
 * @returns {number} Entero parseado
 */
const parseId = (value) => Number.parseInt(value, 10);

/**
 * Detecta el error de Prisma "registro no encontrado" (P2025).
 *
 * @param {Object} error - Error lanzado por Prisma
 * @returns {boolean} true si el código es P2025
 */
const isNotFoundError = (error) => error?.code === 'P2025';

/**
 * Detecta el error de Prisma de violación de constraint único (P2002).
 *
 * @param {Object} error - Error lanzado por Prisma
 * @returns {boolean} true si el código es P2002
 */
const isDuplicateError = (error) => error?.code === 'P2002';

/**
 * Reordena registros asignando position según el orden de `orderedIds`.
 *
 * @param {Object} prisma - Cliente de Prisma (expone $transaction)
 * @param {Object} model - Delegate del modelo (p.ej. prisma.collection)
 * @param {number[]} orderedIds - IDs en el orden deseado
 * @returns {Promise} Resultado de la transacción
 */
const reorderByPosition = (prisma, model, orderedIds) =>
  prisma.$transaction(
    orderedIds.map((id, index) =>
      model.update({ where: { id }, data: { position: index } })
    )
  );

export { parseId, isNotFoundError, isDuplicateError, reorderByPosition };
