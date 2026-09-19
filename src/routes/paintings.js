import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, paintingSchema, paintingUpdateSchema, reorderSchema } from '../middleware/validate.js';
import * as controller from '../controllers/paintings.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
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
  validate(paintingUpdateSchema),
  controller.update
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  controller.remove
);

export default router;
