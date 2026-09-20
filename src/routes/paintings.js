import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, paintingSchema, paintingUpdateSchema, reorderSchema } from '../middleware/validate.js';
import { upload } from '../services/upload.js';
import * as controller from '../controllers/paintings.js';

/**
 * Router público de pinturas
 * - GET /:id → HU03: Ficha de pintura
 */
const publicRouter = Router();

publicRouter.get('/:id', controller.getById);

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(paintingSchema),
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
  '/:id/feature',
  authenticate,
  requireAdmin,
  controller.feature
);

router.put(
  '/:id/publish',
  authenticate,
  requireAdmin,
  controller.publish
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(paintingUpdateSchema),
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
