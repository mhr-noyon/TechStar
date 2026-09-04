import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  jwtSecret: process.env.JWT_SECRET,
};