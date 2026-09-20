import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, collectionSchema, reorderSchema } from '../middleware/validate.js';
import * as controller from '../controllers/collections.js';

/**
 * Router público de colecciones
 * - GET / → HU01: Listar colecciones publicadas
 */
const publicRouter = Router();

publicRouter.get('/', controller.listPublished);

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(collectionSchema),
  controller.create
);

router.put(
  '/reorder',
  authenticate,
  requireAdmin,
  validate(reorderSchema),
  controller.reorder
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(collectionSchema),
  controller.update
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  controller.remove
);

export { publicRouter };
export default router;
