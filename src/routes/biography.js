import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, biographySchema } from '../middleware/validate.js';
import * as controller from '../controllers/biography.js';

/**
 * Router público de biografía
 * - GET / → HU11: Leer biografía (sin auth)
 */
const publicRouter = Router();

publicRouter.get('/', controller.get);

const router = Router();

router.get(
  '/',
  authenticate,
  requireAdmin,
  controller.get
);

router.put(
  '/',
  authenticate,
  requireAdmin,
  validate(biographySchema),
  controller.createOrUpdate
);

export { publicRouter };
export default router;
