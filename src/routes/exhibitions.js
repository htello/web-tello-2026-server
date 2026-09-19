import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, exhibitionSchema, exhibitionUpdateSchema, reorderSchema } from '../middleware/validate.js';
import * as controller from '../controllers/exhibitions.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(exhibitionSchema),
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
  validate(exhibitionUpdateSchema),
  controller.update
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  controller.remove
);

export default router;
