import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, biographySchema, biographyUpdateSchema } from '../middleware/validate.js';
import { upload } from '../services/upload.js';
import * as controller from '../controllers/biography.js';

/**
 * Router público de biografía
 * - GET / → HU11: Leer biografía (sin auth)
 */
const publicRouter = Router();

publicRouter.get('/', controller.get);

const router = Router();

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(biographySchema),
  controller.create
);

router.put(
  '/',
  authenticate,
  requireAdmin,
  upload.single('image'),
  validate(biographyUpdateSchema),
  controller.update
);

export { publicRouter };
export default router;
