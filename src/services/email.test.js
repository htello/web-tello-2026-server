/**
 * @fileoverview Tests unitarios de HU14 - Servicio de Email.
 *
 * Verifica el envío de emails de contacto con Nodemailer mockeado.
 *
 * @module services/email.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: vi.fn() })),
  },
}));

const { sendContactEmail, transporter } = await import('./email.js');

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
});
