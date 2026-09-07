import express from "express";
import cors from "cors";
import { supabase } from "./config/database.js";
import { env } from "./config/env.js";
import serviceRequestRoutes from "./routes/serviceRequest.routes.js";
import technicianRoutes from "./routes/technician.routes.js";
import userRoutes from "./routes/user.routes.js";
import supervisorRoutes from "./routes/supervisor.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(globalRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/users", userRoutes);
app.use("/api/supervisor", supervisorRoutes);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

import { authenticateToken, authorizeRoles } from "./middleware/auth.middleware.js";

// Test Supabase connection (restricted to Supervisor)
app.get("/api/db-test", authenticateToken, authorizeRoles("SUPERVISOR"), async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("id, name, role");

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        success: false,
        message: "Supabase query failed",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Supabase connection successful",
      count: data.length,
    });
  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

app.use(errorHandler);

export default app;
