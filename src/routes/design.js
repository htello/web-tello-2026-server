import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, designSchema, designUpdateSchema } from '../middleware/validate.js';
import { upload } from '../services/upload.js';
import * as controller from '../controllers/design.js';

/**
 * Router público de diseño
 * - GET / → HU08: Filtrar proyectos de diseño
 */
const publicRouter = Router();

publicRouter.get('/featured', controller.listFeatured);
publicRouter.get('/', controller.listFiltered);

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(designSchema),
  controller.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(designUpdateSchema),
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
