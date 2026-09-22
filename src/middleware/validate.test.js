/**
 * @fileoverview Tests unitarios del middleware de validación.
 *
 * Cubre los schemas de actualización (`.min(1)`) para garantizar que
 * devuelven un mensaje en español cuando el body está vacío, y el
 * tratamiento de strings vacíos en campos opcionales (multipart/form-data).
 *
 * @module middleware/validate.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validate,
  userUpdateSchema,
  paintingSchema,
  paintingUpdateSchema,
  collectionSchema,
  exhibitionSchema,
  exhibitionUpdateSchema,
  designUpdateSchema,
  illustrationUpdateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './validate.js';

describe('HU - Validate Middleware (schemas de actualización)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  const updateSchemas = [
    ['paintingUpdateSchema', paintingUpdateSchema],
    ['exhibitionUpdateSchema', exhibitionUpdateSchema],
    ['designUpdateSchema', designUpdateSchema],
    ['illustrationUpdateSchema', illustrationUpdateSchema],
  ];

  describe.each(updateSchemas)('%s', (_name, schema) => {
    it('should return 400 with Spanish message when body is empty', () => {
      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Debe enviar al menos un campo para actualizar',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should pass with a valid email', () => {
      req.body = { email: 'admin@test.com' };
      validate(forgotPasswordSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when email is missing', () => {
      req.body = {};
      validate(forgotPasswordSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El email es obligatorio',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when email is invalid', () => {
      req.body = { email: 'no-es-un-email' };
      validate(forgotPasswordSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El email debe ser válido',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('resetPasswordSchema', () => {
    it('should pass with valid token and strong password', () => {
      req.body = { token: 'abc123def456', password: 'NuevaClave1!' };
      validate(resetPasswordSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when token is missing', () => {
      req.body = { password: 'NuevaClave1!' };
      validate(resetPasswordSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El token es obligatorio',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when token is empty', () => {
      req.body = { token: '', password: 'NuevaClave1!' };
      validate(resetPasswordSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El token no puede estar vacío',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return 400 when password is weak', () => {
      req.body = { token: 'abc123', password: 'debil123' };
      validate(resetPasswordSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La contraseña debe incluir al menos una letra mayúscula y un símbolo',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('userUpdateSchema (rol)', () => {
    it('should return 400 when role is empty', () => {
      req.body = { role: '' };
      validate(userUpdateSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El rol no puede estar vacío',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when role is invalid', () => {
      req.body = { role: 'VIEWER' };
      validate(userUpdateSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El rol debe ser ADMIN o USER',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass when role is valid', () => {
      req.body = { role: 'ADMIN' };
      validate(userUpdateSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

describe('HU - Strings vacíos en campos opcionales (multipart/form-data)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('paintingSchema (POST /admin/paintings)', () => {
    it('should pass and strip empty booleans with collectionId string coercion', () => {
      req.body = {
        title: 'Obra nueva',
        collectionId: '53',
        imageUrl: '',
        dimensions: '',
        technique: '',
        year: '2024',
        isPublished: '',
        isFeatured: '',
      };
      validate(paintingSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.collectionId).toBe(53);
      expect(req.body.year).toBe(2024);
      expect(req.body.isPublished).toBeUndefined();
      expect(req.body.isFeatured).toBeUndefined();
    });

    it('should convert numeric strings from form-data', () => {
      req.body = {
        title: 'Obra nueva',
        collectionId: '53',
        year: '2050',
        isPublished: 'true',
      };
      validate(paintingSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.year).toBe(2050);
      expect(req.body.isPublished).toBe(true);
    });

    it('should return 400 when year is missing', () => {
      req.body = { title: 'Obra nueva', collectionId: '53' };
      validate(paintingSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El año es obligatorio',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when year is an empty string (form-data)', () => {
      req.body = { title: 'Obra nueva', collectionId: '53', year: '' };
      validate(paintingSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El año es obligatorio',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 with required message when collectionId is empty string', () => {
      req.body = { title: 'Obra nueva', collectionId: '', year: 2024 };
      validate(paintingSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La colección es obligatoria',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when year is out of range', () => {
      req.body = { title: 'Obra nueva', collectionId: '53', year: '1899' };
      validate(paintingSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('paintingUpdateSchema (PUT /admin/paintings/:id)', () => {
    it('should pass and strip empty optional fields', () => {
      req.body = { title: 'Actualizada', year: '', collectionId: '', isPublished: '' };
      validate(paintingUpdateSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ title: 'Actualizada' });
    });

    it('should return 400 when only empty fields are sent', () => {
      req.body = { year: '' };
      validate(paintingUpdateSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Debe enviar al menos un campo para actualizar',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('collectionSchema (POST /admin/collections)', () => {
    it('should pass and strip empty position and isPublished', () => {
      req.body = { title: 'Colección', position: '', isPublished: '' };
      validate(collectionSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.position).toBeUndefined();
      expect(req.body.isPublished).toBeUndefined();
    });

    it('should return 400 with Spanish message when position is not a number', () => {
      req.body = { title: 'Colección', position: 'abc' };
      validate(collectionSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La posición debe ser un número',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('exhibitionSchema (POST /admin/exhibitions)', () => {
    it('should return 400 with required message when date is empty string', () => {
      req.body = { title: 'Exposición', date: '', position: '', isPublished: '' };
      validate(exhibitionSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha es obligatoria',
        code: 'VALIDATION_ERROR',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('exhibitionUpdateSchema (PUT /admin/exhibitions/:id)', () => {
    it('should pass and strip empty date, position and isPublished', () => {
      req.body = { title: 'Exposición', date: '', position: '', isPublished: '' };
      validate(exhibitionUpdateSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ title: 'Exposición' });
    });
  });
});
