import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, illustrationSchema, illustrationUpdateSchema } from '../middleware/validate.js';
import { upload } from '../services/upload.js';
import * as controller from '../controllers/illustrations.js';

/**
 * Router público de ilustraciones
 * - GET / → HU09: Galería de ilustraciones
 */
const publicRouter = Router();

publicRouter.get('/featured', controller.listFeatured);
publicRouter.get('/', controller.listAll);

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(illustrationSchema),
  controller.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(illustrationUpdateSchema),
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
