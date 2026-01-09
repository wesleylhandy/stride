/**
 * Email service abstraction for sending system emails
 * Supports multiple email providers through a unified interface
 */

import nodemailer, { type Transporter } from 'nodemailer';
import {
  generateInvitationEmailHtml,
  generateInvitationEmailText,
  type InvitationEmailParams,
} from './email-templates';
import { logger } from '../logger';

/**
 * Email service interface
 * Allows different email provider implementations
 */
export interface EmailService {
  /**
   * Send an invitation email
   * @param params - Invitation email parameters
   * @throws Error if email cannot be sent
   */
  sendInvitation(params: {
    to: string;
    token: string;
    invitedByName: string | null;
    expiresAt: Date;
    inviteUrl: string;
  }): Promise<void>;

  /**
   * Check if the email service is available and configured
   * @returns True if email service is available, false otherwise
   */
  isAvailable(): boolean;
}

/**
 * SMTP email service implementation
 * Uses nodemailer with SMTP configuration from environment variables
 */
class SMTPEmailService implements EmailService {
  private transporter: Transporter | null = null;
  private configured = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize SMTP transporter if configuration is available
   */
  private initialize(): void {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';

    // Check if SMTP is configured
    if (!host || !port) {
      this.configured = false;
      logger.warn('SMTP email service not configured. Missing required environment variables (SMTP_HOST, SMTP_PORT).');
      return;
    }

    try {
      // Build transporter config (auth is optional for local testing servers like MailHog)
      const transporterConfig: any = {
        host,
        port: parseInt(port, 10),
        secure: secure,
        // Allow self-signed certificates in development
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      };

      // Only add auth if user and password are provided (required for most SMTP servers, optional for MailHog)
      if (user && password) {
        transporterConfig.auth = {
          user,
          pass: password,
        };
      }

      this.transporter = nodemailer.createTransport(transporterConfig);

      this.configured = true;
      logger.info('SMTP email service initialized successfully');
    } catch (error) {
      this.configured = false;
      logger.error(
        'Failed to initialize SMTP email service',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Check if SMTP service is available
   */
  isAvailable(): boolean {
    return this.configured && this.transporter !== null;
  }

  /**
   * Send invitation email
   */
  async sendInvitation(params: {
    to: string;
    token: string;
    invitedByName: string | null;
    expiresAt: Date;
    inviteUrl: string;
  }): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Email service is not available. SMTP is not configured.');
    }

    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@stride.local';

    const emailParams: InvitationEmailParams = {
      email: params.to,
      token: params.token,
      invitedByName: params.invitedByName,
      expiresAt: params.expiresAt,
      inviteUrl: params.inviteUrl,
    };

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject: 'Invitation to join Stride',
        text: generateInvitationEmailText(emailParams),
        html: generateInvitationEmailHtml(emailParams),
      });

      logger.info('Invitation email sent successfully', {
        to: params.to,
      });
    } catch (error) {
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to send invitation email';

      if (error instanceof Error) {
        // Check for common SMTP errors
        if (error.message.includes('ECONNREFUSED') || error.message.includes('EHLO')) {
          errorMessage = 'Cannot connect to email server. Please check SMTP configuration.';
        } else if (error.message.includes('EAUTH') || error.message.includes('authentication')) {
          errorMessage = 'Email authentication failed. Please check SMTP credentials.';
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
          errorMessage = 'Email server connection timed out. Please try again later.';
        } else if (error.message.includes('ENOTFOUND')) {
          errorMessage = 'Email server hostname not found. Please check SMTP_HOST configuration.';
        } else {
          errorMessage = `Failed to send invitation email: ${error.message}`;
        }

        logger.error(
          'Failed to send invitation email',
          error,
          {
            to: params.to,
            errorType: error.constructor.name,
            errorMessage: error.message,
          },
        );
      } else {
        logger.error(
          'Failed to send invitation email (unknown error type)',
          undefined,
          {
            to: params.to,
            error: String(error),
          },
        );
      }

      throw new Error(errorMessage);
    }
  }
}

/**
 * No-op email service for development/testing
 * Always returns that it's unavailable
 */
class NoOpEmailService implements EmailService {
  isAvailable(): boolean {
    return false;
  }

  async sendInvitation(): Promise<void> {
    throw new Error('Email service is not available');
  }
}

/**
 * Get the appropriate email service instance
 * Returns SMTP service if configured, otherwise NoOp service
 */
function getEmailService(): EmailService {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (host && port && user && password) {
    return new SMTPEmailService();
  }

  return new NoOpEmailService();
}

// Export singleton instance
export const emailService = getEmailService();
