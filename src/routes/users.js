/**
 * @fileoverview Rutas de gestión de usuarios (Admin).
 *
 * Define los endpoints de registro y gestión de usuarios. Todos los
 * endpoints requieren autenticación JWT con rol ADMIN.
 *
 * @module routes/users
 * @requires express
 * @requires controllers/auth
 * @requires controllers/users
 * @requires middleware/auth
 * @requires middleware/validate
 */

import { Router } from 'express';
import { register } from '../controllers/auth.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, registerSchema, userUpdateSchema, passwordResetSchema } from '../middleware/validate.js';
import * as usersController from '../controllers/users.js';

const router = Router();

router.post('/register', authenticate, requireAdmin, validate(registerSchema), register);
router.get('/', authenticate, requireAdmin, usersController.list);
router.get('/:id', authenticate, requireAdmin, usersController.getById);
router.put('/:id', authenticate, requireAdmin, validate(userUpdateSchema), usersController.update);
router.delete('/:id', authenticate, requireAdmin, usersController.remove);
router.put('/:id/password', authenticate, requireAdmin, validate(passwordResetSchema), usersController.resetPassword);

export default router;
