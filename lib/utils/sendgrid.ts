/**
 * SendGrid Email Utility
 * Configured to use SENDGRID_API_KEY from environment variables
 */

import sgMail from '@sendgrid/mail'
import { NOREPLY_EMAIL } from '@/lib/constants/contact'

// Set API key from environment variable
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
} else {
  console.warn('SENDGRID_API_KEY is not set in environment variables')
}

/**
 * Send an email using SendGrid
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @param from - Sender email address (defaults to NOREPLY_EMAIL)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string = NOREPLY_EMAIL
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured')
    }

    const msg = {
      to,
      from,
      subject,
      html,
    }

    const [response] = await sgMail.send(msg)

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to WorkVouch, ${name}!</h1>
      <p>Thank you for joining WorkVouch. We're excited to help you build your verified career profile.</p>
      <p>Get started by:</p>
      <ul>
        <li>Adding your job history</li>
        <li>Connecting with coworkers</li>
        <li>Building your Trust Score</li>
      </ul>
      <p>Best regards,<br>The WorkVouch Team</p>
    </div>
  `

  const result = await sendEmail(
    to,
    'Welcome to WorkVouch',
    html
  )

  return result
}

/**
 * Send a verification email
 */
export async function sendVerificationEmail(
  to: string,
  verificationLink: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Verify Your Email Address</h1>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Verify Email
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The WorkVouch Team</p>
    </div>
  `

  const result = await sendEmail(
    to,
    'Verify Your WorkVouch Email Address',
    html
  )

  return result
}

export default sgMail
