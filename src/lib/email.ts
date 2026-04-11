/**
 * @deprecated – This file is a legacy shim. All email functions have been
 * consolidated into `@/lib/emailService.ts` which uses Resend.
 *
 * Any imports from '@/lib/email' are re-exported from emailService so
 * nothing breaks, but new code should import from '@/lib/emailService'
 * directly.
 */
export {
  sendEmail,
  sendWelcomeEmail,
  sendWorkOrderCreatedEmail,
  sendStatusUpdateEmail,
  sendPaymentConfirmationEmail,
} from './emailService';
