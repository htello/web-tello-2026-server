import { Router } from 'express';
import { login } from '../controllers/auth.js';
import { validate, loginSchema } from '../middleware/validate.js';

const router = Router();

router.post('/login', validate(loginSchema), login);

export default router;
