import { Router } from 'express';
import { validate, contactSchema } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiter.js';
import * as controller from '../controllers/contact.js';

/**
 * Router público de contacto
 * - POST / → HU13: Enviar mensaje (rate limited, sin auth)
 */
const router = Router();

router.post('/', contactLimiter, validate(contactSchema), controller.send);

export default router;
