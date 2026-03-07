/**
 * Send verification invite link via SMS.
 * Placeholder: logs only. Will later integrate with Twilio to send actual SMS.
 */

export async function sendVerificationSMS(
  phone: string,
  link: string
): Promise<void> {
  // TODO: Integrate with Twilio to send SMS with link
  // e.g. await twilioClient.messages.create({ to: phone, body: `Verify: ${link}` });
  console.log("Send SMS to", phone, link);
}
