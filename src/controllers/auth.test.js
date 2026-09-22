import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { mockPrisma } from '../../tests/helpers/prisma-mock.js';
import { JWT_SECRET } from '../lib/constants.js';

vi.mock('../services/email.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../services/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { login, register, forgotPassword, resetPassword } = await import('../controllers/auth.js');
const { sendPasswordResetEmail } = await import('../services/email.js');
const logger = (await import('../services/logger.js')).default;

describe('HU20 - Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('login', () => {
    describe('given valid credentials', () => {
      it('should return 200 with token and user data', async () => {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const mockUser = {
          id: 1,
          email: 'admin@test.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        req.body = { email: 'admin@test.com', password: 'admin123' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              token: expect.any(String),
              user: expect.objectContaining({
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN',
              }),
            }),
          })
        );

        const { data } = res.json.mock.calls[0][0];
        const decoded = jwt.verify(data.token, JWT_SECRET);
        expect(decoded).toHaveProperty('id', 1);
        expect(decoded).toHaveProperty('email', 'admin@test.com');
        expect(decoded).toHaveProperty('role', 'ADMIN');
      });
    });

    describe('given email not found', () => {
      it('should return 401', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        req.body = { email: 'nonexistent@test.com', password: 'admin123' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Credenciales inválidas',
          code: 'UNAUTHORIZED',
        });
      });
    });

    describe('given wrong password', () => {
      it('should return 401', async () => {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const mockUser = {
          id: 1,
          email: 'admin@test.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        req.body = { email: 'admin@test.com', password: 'wrongpassword' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Credenciales inválidas',
          code: 'UNAUTHORIZED',
        });
      });
    });

    describe('given database error', () => {
      it('should return 500', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.body = { email: 'admin@test.com', password: 'admin123' };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('register', () => {
    describe('given valid data and unique email', () => {
      it('should return 201 with user data and role ADMIN', async () => {
        const hashedPassword = await bcrypt.hash('Clave123!', 12);
        const createdUser = {
          id: 2,
          email: 'nuevo-admin@test.com',
          password: hashedPassword,
          name: 'Nuevo Admin',
          role: 'ADMIN',
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(createdUser);
        req.body = { email: 'nuevo-admin@test.com', password: 'Clave123!', name: 'Nuevo Admin' };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: 2,
              email: 'nuevo-admin@test.com',
              name: 'Nuevo Admin',
              role: 'ADMIN',
            }),
          })
        );

        const { data } = res.json.mock.calls[0][0];
        expect(data).not.toHaveProperty('password');
      });
    });

    describe('given duplicate email', () => {
      it('should return 400 with validation error', async () => {
        const existingUser = { id: 1, email: 'existing@test.com' };
        mockPrisma.user.findUnique.mockResolvedValue(existingUser);
        req.body = { email: 'existing@test.com', password: 'clave123' };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'El email ya está registrado',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given database error', () => {
      it('should return 500 with internal server error', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.body = { email: 'nuevo-admin@test.com', password: 'clave123' };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('forgotPassword', () => {
    const GENERIC_MESSAGE = 'Si el email está registrado, recibirás un enlace para restablecer la contraseña';

    describe('given an unregistered email', () => {
      it('should return 200 with generic message and not send email', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        req.body = { email: 'ghost@test.com' };

        await forgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: GENERIC_MESSAGE },
        });
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
        expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      });
    });

    describe('given a registered email', () => {
      it('should store hashed token with expiry and send reset email', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'admin@test.com' });
        mockPrisma.user.update.mockResolvedValue({ id: 1 });
        sendPasswordResetEmail.mockResolvedValue({ success: true });
        req.body = { email: 'admin@test.com' };

        await forgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: GENERIC_MESSAGE },
        });

        expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        const [to, link] = sendPasswordResetEmail.mock.calls[0];
        expect(to).toBe('admin@test.com');
        expect(link).toContain('/reset-password?token=');

        const rawToken = link.split('token=')[1];
        const updateCall = mockPrisma.user.update.mock.calls[0][0];
        expect(updateCall.where).toEqual({ id: 1 });
        expect(updateCall.data.passwordResetToken).toBe(
          createHash('sha256').update(rawToken).digest('hex')
        );
        expect(updateCall.data.passwordResetToken).not.toBe(rawToken);
        expect(updateCall.data.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given email sending fails', () => {
      it('should still return 200 and log the error', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'admin@test.com' });
        mockPrisma.user.update.mockResolvedValue({ id: 1 });
        sendPasswordResetEmail.mockResolvedValue({ success: false, error: 'SMTP down' });
        req.body = { email: 'admin@test.com' };

        await forgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.error).toHaveBeenCalled();
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.body = { email: 'admin@test.com' };

        await forgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });

  describe('resetPassword', () => {
    const futureDate = () => new Date(Date.now() + 60 * 60 * 1000);
    const pastDate = () => new Date(Date.now() - 60 * 1000);

    describe('given a valid token', () => {
      it('should update password and clear token', async () => {
        const hashedToken = createHash('sha256').update('raw-token').digest('hex');
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          email: 'admin@test.com',
          passwordResetToken: hashedToken,
          passwordResetExpires: futureDate(),
        });
        mockPrisma.user.update.mockResolvedValue({ id: 1 });
        req.body = { token: 'raw-token', password: 'NuevaClave1!' };

        await resetPassword(req, res);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { passwordResetToken: hashedToken },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: { message: 'Contraseña actualizada correctamente' },
        });

        const updateCall = mockPrisma.user.update.mock.calls[0][0];
        expect(updateCall.where).toEqual({ id: 1 });
        expect(updateCall.data.passwordResetToken).toBeNull();
        expect(updateCall.data.passwordResetExpires).toBeNull();
        expect(await bcrypt.compare('NuevaClave1!', updateCall.data.password)).toBe(true);
        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('given an unknown token', () => {
      it('should return 400 with generic message', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        req.body = { token: 'unknown', password: 'NuevaClave1!' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token inválido o expirado',
          code: 'VALIDATION_ERROR',
        });
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe('given an expired token', () => {
      it('should return 400 with generic message', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          passwordResetToken: 'hash',
          passwordResetExpires: pastDate(),
        });
        req.body = { token: 'raw-token', password: 'NuevaClave1!' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token inválido o expirado',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given a user without expiry date', () => {
      it('should return 400 with generic message', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          passwordResetToken: 'hash',
          passwordResetExpires: null,
        });
        req.body = { token: 'raw-token', password: 'NuevaClase1!' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token inválido o expirado',
          code: 'VALIDATION_ERROR',
        });
      });
    });

    describe('given database error', () => {
      it('should return 500 INTERNAL_ERROR', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));
        req.body = { token: 'raw-token', password: 'NuevaClave1!' };

        await resetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
        });
      });
    });
  });
});
