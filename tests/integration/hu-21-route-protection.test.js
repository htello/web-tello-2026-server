import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../helpers/prisma-mock.js';
import { JWT_SECRET } from '../../src/lib/constants.js';

const app = (await import('../../src/app.js')).default;

describe('HU21 - Protección de Rutas', () => {
  let adminToken;

  beforeEach(() => {
    vi.clearAllMocks();

    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('given public endpoint', () => {
    it('should allow access without token on health check', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });

    it('should allow access without token on login', async () => {
      const hashedPassword = await import('bcrypt').then(b => b.default.hash('admin123', 12));
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });
  });

  describe('given protected route that does not exist', () => {
    it('should return 404 (route not found)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users');

      expect(res.status).toBe(404);
    });
  });

  describe('given valid admin token format', () => {
    it('should decode token correctly', () => {
      const decoded = jwt.verify(adminToken, JWT_SECRET);

      expect(decoded).toHaveProperty('id', 1);
      expect(decoded).toHaveProperty('email', 'admin@test.com');
      expect(decoded).toHaveProperty('role', 'ADMIN');
    });
  });
});
