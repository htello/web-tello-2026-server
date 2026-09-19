import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, biographySchema } from '../middleware/validate.js';
import * as controller from '../controllers/biography.js';

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

export default router;
