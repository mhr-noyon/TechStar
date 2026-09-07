import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
  : [];

export const env = {
  port: process.env.PORT || 5000,

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,

  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET || "techstar_jwt_secret_key_2026_default",

  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "techstar_jwt_refresh_secret_key_2026_default",

  allowedOrigins,

  // Rate Limiting Configuration
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  rateLimitMaxGlobal: Number(process.env.RATE_LIMIT_MAX_GLOBAL) || 120, // 120 requests/min/IP
  rateLimitMaxSensitive: Number(process.env.RATE_LIMIT_MAX_SENSITIVE) || 10, // 10 requests/min/IP for login & track

  // SMTP Mail Configuration
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "Service Request Created <mhnoyonmd141@gmail.com>",

  clientUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  serverUrl: process.env.SERVER_URL || "http://localhost:5000",

  workerPeriod: process.env.WORKER_PERIOD || 60000
};