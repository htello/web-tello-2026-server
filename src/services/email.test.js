/**
 * @fileoverview Tests unitarios de HU14 - Servicio de Email.
 *
 * Verifica el envío de emails de contacto con Nodemailer mockeado.
 *
 * @module services/email.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: vi.fn() })),
  },
}));

const { sendContactEmail, sendPasswordResetEmail, transporter } = await import('./email.js');

describe('HU14 - Servicio de Email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendContactEmail', () => {
    it('should send email and return success true', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'abc123' });

      const result = await sendContactEmail({
        name: 'Juan',
        email: 'juan@test.com',
        subject: 'Consulta',
        message: 'Me interesa esta obra',
      });

      expect(result).toEqual({ success: true });
      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'juan@test.com',
          subject: '[Contacto] Consulta',
        })
      );
    });

    it('should escape HTML in the email body', async () => {
      transporter.sendMail.mockResolvedValue({});

      await sendContactEmail({
        name: '<b>Juan</b>',
        email: 'juan@test.com',
        subject: 'Asunto',
        message: '<script>alert(1)</script>',
      });

      const mailOptions = transporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('&lt;b&gt;Juan&lt;/b&gt;');
      expect(mailOptions.html).not.toContain('<script>');
    });

    it('should return success false when sending fails', async () => {
      transporter.sendMail.mockRejectedValue(new Error('SMTP connection error'));

      const result = await sendContactEmail({
        name: 'Juan',
        email: 'juan@test.com',
        subject: 'Consulta',
        message: 'Me interesa esta obra',
      });

      expect(result).toEqual({ success: false, error: 'SMTP connection error' });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send reset email and return success true', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: 'reset123' });

      const result = await sendPasswordResetEmail(
        'admin@test.com',
        'http://localhost:5173/reset-password?token=abc123'
      );

      expect(result).toEqual({ success: true });
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: '[Portfolio] Restablecer contraseña',
        })
      );
      const mailOptions = transporter.sendMail.mock.calls[0][0];
      expect(mailOptions.html).toContain('reset-password?token=abc123');
    });

    it('should return success false when sending fails', async () => {
      transporter.sendMail.mockRejectedValue(new Error('SMTP connection error'));

      const result = await sendPasswordResetEmail('admin@test.com', 'http://link');

      expect(result).toEqual({ success: false, error: 'SMTP connection error' });
    });
  });

  describe('Resend HTTP (RESEND_API_KEY definido)', () => {
    let fetchMock;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      vi.stubEnv('RESEND_API_KEY', 're_test_key');
      vi.stubEnv('SMTP_USER', 'admin@portfolio.com');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    it('sendContactEmail should POST to Resend with default from and reply_to', async () => {
      fetchMock.mockResolvedValue({ ok: true });

      const result = await sendContactEmail({
        name: 'Juan',
        email: 'juan@test.com',
        subject: 'Consulta',
        message: 'Me interesa esta obra',
      });

      expect(result).toEqual({ success: true });
      expect(transporter.sendMail).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer re_test_key',
            'Content-Type': 'application/json',
          },
        })
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.from).toBe('onboarding@resend.dev');
      expect(body.to).toEqual(['admin@portfolio.com']);
      expect(body.reply_to).toBe('juan@test.com');
      expect(body.subject).toBe('[Contacto] Consulta');
      expect(body.html).toContain('Juan');
    });

    it('should use EMAIL_FROM when defined', async () => {
      vi.stubEnv('EMAIL_FROM', 'Portfolio <no-reply@portfolio.com>');
      fetchMock.mockResolvedValue({ ok: true });

      await sendContactEmail({
        name: 'Juan',
        email: 'juan@test.com',
        subject: 'Consulta',
        message: 'Hola',
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.from).toBe('Portfolio <no-reply@portfolio.com>');
    });

    it('sendPasswordResetEmail should POST to Resend without reply_to', async () => {
      fetchMock.mockResolvedValue({ ok: true });

      const result = await sendPasswordResetEmail(
        'admin@test.com',
        'http://front/reset-password?token=abc123'
      );

      expect(result).toEqual({ success: true });
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.to).toEqual(['admin@test.com']);
      expect(body.subject).toBe('[Portfolio] Restablecer contraseña');
      expect(body.html).toContain('reset-password?token=abc123');
      expect(body.reply_to).toBeUndefined();
    });

    it('should return success false when Resend responds with an error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'You can only send testing emails to your own address' }),
      });

      const result = await sendContactEmail({
        name: 'Juan',
        email: 'juan@test.com',
        subject: 'Consulta',
        message: 'Hola',
      });

      expect(result).toEqual({
        success: false,
        error: 'You can only send testing emails to your own address',
      });
    });

    it('should return success false when Resend error body is not JSON', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('bad json'); },
      });

      const result = await sendPasswordResetEmail('admin@test.com', 'http://link');

      expect(result).toEqual({ success: false, error: 'Resend respondió 500' });
    });

    it('should return success false when fetch fails', async () => {
      fetchMock.mockRejectedValue(new Error('Network failure'));

      const result = await sendContactEmail({
        name: 'Juan',
        email: 'juan@test.com',
        subject: 'Consulta',
        message: 'Hola',
      });

      expect(result).toEqual({ success: false, error: 'Network failure' });
    });
  });

  describe('configuración del transporter', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it('should use implicit TLS when SMTP_PORT is 465', async () => {
      vi.stubEnv('SMTP_PORT', '465');
      vi.resetModules();

      const nodemailer = (await import('nodemailer')).default;
      await import('./email.js');

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465, secure: true })
      );
    });

    it('should default to port 587 with STARTTLS when SMTP_PORT is empty', async () => {
      vi.stubEnv('SMTP_PORT', '');
      vi.resetModules();

      const nodemailer = (await import('nodemailer')).default;
      await import('./email.js');

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
          secure: false,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
        })
      );
    });
  });
});
