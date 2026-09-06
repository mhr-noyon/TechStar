import nodemailer from "nodemailer";
import { supabase } from "../config/database.js";
import { env } from "../config/env.js";

// In-memory tracking store fallback
const inMemorySentEmails = new Set();

/**
 * Checks if a confirmation email has already been sent for the given service request ID.
 * @param {number|string} serviceId
 * @returns {Promise<boolean>}
 */
export async function isEmailAlreadySent(serviceId) {
  const numericId = Number(serviceId);
  if (inMemorySentEmails.has(numericId)) return true;

  try {
    const { data, error } = await supabase
      .from("service_request_emails")
      .select("service_id")
      .eq("service_id", numericId)
      .maybeSingle();

    if (!error && data) {
      inMemorySentEmails.add(numericId);
      return true;
    }
  } catch (err) {
    console.warn("isEmailAlreadySent DB query notice:", err.message);
  }

  return false;
}

/**
 * Marks a service request email as sent in the database and in-memory store.
 * @param {number|string} serviceId
 */
export async function recordEmailSent(serviceId) {
  const numericId = Number(serviceId);
  const now = new Date().toISOString();
  inMemorySentEmails.add(numericId);

  try {
    const { error } = await supabase
      .from("service_request_emails")
      .upsert(
        {
          service_id: numericId,
          email_sent_at: now,
        },
        { onConflict: "service_id", ignoreDuplicates: true }
      );

    if (error) {
      console.warn("Could not record email sent in DB (using in-memory store):", error.message);
    }
  } catch (err) {
    console.warn("recordEmailSent exception:", err.message);
  }
}

/**
 * Sends a confirmation email to the customer for a service request.
 * @param {object} params
 * @param {object} params.serviceRequest
 * @param {object} [params.customer]
 */
export async function sendConfirmationEmail({ serviceRequest, customer }) {
  const recipientEmail = customer?.email || serviceRequest.customer?.email;
  const customerName = customer?.name || serviceRequest.customer?.name || "Valued Customer";

  if (!recipientEmail) {
    console.warn(`No recipient email address found for Service Request #SR-${serviceRequest.id}. Skipping email.`);
    return true; // Don't fail the job if customer email is missing
  }

  // Pre-record in database to prevent concurrent polling race conditions
  await recordEmailSent(serviceRequest.id);

  // Configure transporter using SMTP settings from env
  const transporter = nodemailer.createTransport({
    host: env.smtpHost || "localhost",
    port: env.smtpPort || 587,
    secure: env.smtpSecure || false,
    auth: env.smtpUser
      ? {
          user: env.smtpUser,
          pass: env.smtpPass,
        }
      : undefined,
  });

  const mailOptions = {
    from: env.mailFrom,
    to: recipientEmail,
    subject: `Service Request Confirmation #SR-${serviceRequest.id} - TechStar`,
    text: `Hello ${customerName},\n\nYour service request #SR-${serviceRequest.id} has been successfully created.\n\nDevice Info: ${serviceRequest.device_info || "N/A"}\nProblem Description: ${serviceRequest.problem_description || "N/A"}\nAccess Code: ${serviceRequest.customer_access_code || "N/A"}\nStatus: ${serviceRequest.status || "RECEIVED"}\n\nThank you for choosing TechStar!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
        <h2 style="color: #0284c7; margin-top: 0;">TechStar Service Request Confirmation</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>Your service request <strong>#SR-${serviceRequest.id}</strong> has been successfully received and logged into our system.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 4px 0;"><strong>Request ID:</strong> #SR-${serviceRequest.id}</p>
          <p style="margin: 4px 0;"><strong>Device Info:</strong> ${serviceRequest.device_info || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Problem Description:</strong> ${serviceRequest.problem_description || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Access Code:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${serviceRequest.customer_access_code || "N/A"}</code></p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #0369a1; font-weight: bold;">${serviceRequest.status || "RECEIVED"}</span></p>
        </div>

        <p>You can track the progress of your repair anytime using your Request ID and Access Code on our <a href="${env.clientUrl}/track">tracking portal</a>.</p>
        <p>Thank you for choosing TechStar!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email confirmation sent to ${recipientEmail} for #SR-${serviceRequest.id} (MessageID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${recipientEmail} for #SR-${serviceRequest.id}:`, err.message);
    throw err;
  }
}
