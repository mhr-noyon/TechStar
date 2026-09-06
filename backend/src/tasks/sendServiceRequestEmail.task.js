import { findServiceRequestById } from "../repositories/serviceRequest.repository.js";
import { isEmailAlreadySent, recordEmailSent, sendConfirmationEmail } from "../services/email.service.js";

/**
 * Graphile Worker task: send-service-request-email
 * - Checks if the email has already been sent for the given service request to prevent duplicate delivery.
 * - Fetches service request details and customer info.
 * - Sends confirmation email via Nodemailer / SMTP.
 * - Records email_sent_at timestamp in database upon success.
 * - Retries at most 3 times if sending fails.
 */
export default async function sendServiceRequestEmailTask(payload = {}) {
  console.log(
    `⏰ [send-service-request-email] Task started at ${new Date().toISOString()}`
  );
  const { requestId, attempt = 1 } = payload;

  if (!requestId) {
    console.warn("sendServiceRequestEmailTask: Missing requestId in payload");
    return;
  }

  console.log(`📧 [send-service-request-email] Processing email for Request #SR-${requestId} (Attempt ${attempt}/3)`);

  // 1. Idempotency Check: Prevent duplicate emails if already sent
  const alreadySent = await isEmailAlreadySent(requestId);
  if (alreadySent) {
    console.log(`ℹ️ Email already delivered for Service Request #SR-${requestId}. Skipping duplicate send.`);
    return;
  }

  // 2. Fetch full service request details
  const serviceRequest = await findServiceRequestById(requestId);
  if (!serviceRequest) {
    console.warn(`sendServiceRequestEmailTask: Service request #SR-${requestId} not found.`);
    return;
  }

  try {
    // 3. Send confirmation email (which records email_sent_at)
    await sendConfirmationEmail({
      serviceRequest,
      customer: serviceRequest.customer,
    });

    console.log(`✅ [send-service-request-email] Email delivery completed and recorded for Request #SR-${requestId}`);
  } catch (err) {
    console.error(`❌ [send-service-request-email] Email failed for #SR-${requestId} on attempt ${attempt}:`, err.message);

    // Limit retries to at most 3 attempts
    if (attempt < 3) {
      throw err; // Throw to trigger Graphile Worker retry mechanism
    } else {
      console.error(`⚠️ Max retries (3) reached for #SR-${requestId}. Abandoning email task.`);
    }
  }

  console.log(
    `⏰ [send-service-request-email] Task completed at ${new Date().toISOString()}`
  );
}
