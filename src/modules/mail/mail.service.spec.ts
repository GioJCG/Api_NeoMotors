import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  })),
}));

describe('MailService', () => {
  let service: MailService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        RESEND_API_KEY: 're_mock_key',
        FRONTEND_URL: 'http://localhost:4200',
        MAIL_FROM: 'NeoMotors <no-reply@neomotors.com>',
      };
      return config[key] || null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email', async () => {
      await expect(
        service.sendVerificationEmail({
          to: 'test@example.com',
          token: 'mock-token-123',
        }),
      ).resolves.toBeUndefined();
    });

    it('should not throw on error', async () => {
      const Resend = require('resend').Resend;
      const mockInstance = (Resend as jest.Mock).mock.results[0].value;
      mockInstance.emails.send.mockRejectedValueOnce(
        new Error('Resend error'),
      );

      await expect(
        service.sendVerificationEmail({
          to: 'test@example.com',
          token: 'mock-token-123',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email', async () => {
      await expect(
        service.sendPasswordResetEmail({
          to: 'test@example.com',
          token: 'mock-token-456',
        }),
      ).resolves.toBeUndefined();
    });

    it('should not throw on error', async () => {
      const Resend = require('resend').Resend;
      const mockInstance = (Resend as jest.Mock).mock.results[0].value;
      mockInstance.emails.send.mockRejectedValueOnce(
        new Error('Resend error'),
      );

      await expect(
        service.sendPasswordResetEmail({
          to: 'test@example.com',
          token: 'mock-token-456',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
