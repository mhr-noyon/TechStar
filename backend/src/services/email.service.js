import nodemailer from "nodemailer";
import { supabase } from "../config/database.js";
import { env } from "../config/env.js";

// In-memory tracking store fallback (stores "serviceId:status" strings)
const inMemorySentEmails = new Set();

/**
 * Checks if a confirmation email has already been sent for the given service request ID and status.
 * @param {number|string} serviceId
 * @param {string} status
 * @returns {Promise<boolean>}
 */
export async function isEmailAlreadySent(serviceId, status = "RECEIVED") {
  const numericId = Number(serviceId);
  const key = `${numericId}:${status}`;
  if (inMemorySentEmails.has(key)) return true;

  try {
    const { data, error } = await supabase
      .from("service_request_emails")
      .select("service_id")
      .eq("service_id", numericId)
      .eq("status", status)
      .maybeSingle();

    if (!error && data) {
      inMemorySentEmails.add(key);
      return true;
    }
  } catch (err) {
    console.warn("isEmailAlreadySent DB query notice:", err.message);
  }

  return false;
}

/**
 * Marks a service request email as sent in the database and in-memory store for a specific status.
 * @param {number|string} serviceId
 * @param {string} status
 */
export async function recordEmailSent(serviceId, status = "RECEIVED") {
  const numericId = Number(serviceId);
  const now = new Date().toISOString();
  const key = `${numericId}:${status}`;
  inMemorySentEmails.add(key);

  try {
    const { error } = await supabase
      .from("service_request_emails")
      .upsert(
        {
          service_id: numericId,
          status: status,
          email_sent_at: now,
        },
        { onConflict: "service_id,status", ignoreDuplicates: true }
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

  const status = serviceRequest.status || "RECEIVED";

  // Pre-record in database to prevent concurrent polling race conditions
  await recordEmailSent(serviceRequest.id, status);

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

  const isReady = status === "READY_FOR_DELIVERY";
  const isFailed = status === "FAILED";
  
  let subjectText = `Service Request Confirmation #SR-${serviceRequest.id} - TechStar`;
  let statusBannerColor = "#0284c7";
  let statusHeadline = "TechStar Service Request Confirmation";
  let statusMessage = `Your service request <strong>#SR-${serviceRequest.id}</strong> has been successfully received and logged into our system.`;

  if (isReady) {
    subjectText = `Your Device is Ready for Delivery! #SR-${serviceRequest.id} - TechStar`;
    statusBannerColor = "#16a34a";
    statusHeadline = "Device Ready for Pickup / Delivery!";
    statusMessage = `Great news! Repair work for service request <strong>#SR-${serviceRequest.id}</strong> is finished and your device is ready for pickup or delivery.`;
  } else if (isFailed) {
    subjectText = `Update on Service Request #SR-${serviceRequest.id} - TechStar`;
    statusBannerColor = "#dc2626";
    statusHeadline = "Service Request Status Update";
    statusMessage = `We regret to inform you that service request <strong>#SR-${serviceRequest.id}</strong> could not be completed.`;
  }

  const mailOptions = {
    from: env.mailFrom,
    to: recipientEmail,
    subject: subjectText,
    text: `Hello ${customerName},\n\n${statusMessage.replace(/<[^>]+>/g, "")}\n\nDevice Info: ${serviceRequest.device_info || "N/A"}\nProblem Description: ${serviceRequest.problem_description || "N/A"}\nAccess Code: ${serviceRequest.customer_access_code || "N/A"}\nStatus: ${status}\n\nThank you for choosing TechStar!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
        <h2 style="color: ${statusBannerColor}; margin-top: 0;">${statusHeadline}</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>${statusMessage}</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid ${statusBannerColor}; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 4px 0;"><strong>Request ID:</strong> #SR-${serviceRequest.id}</p>
          <p style="margin: 4px 0;"><strong>Device Info:</strong> ${serviceRequest.device_info || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Problem Description:</strong> ${serviceRequest.problem_description || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Access Code:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${serviceRequest.customer_access_code || "N/A"}</code></p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${statusBannerColor}; font-weight: bold;">${status.replaceAll("_", " ")}</span></p>
        </div>

        <p>You can track the progress of your repair anytime using your Request ID and Access Code on our <a href="${env.clientUrl}/track">tracking portal</a>.</p>
        <p>Thank you for choosing TechStar!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email confirmation sent to ${recipientEmail} for #SR-${serviceRequest.id} (${status}) (MessageID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${recipientEmail} for #SR-${serviceRequest.id} (${status}):`, err.message);
    throw err;
  }
}
