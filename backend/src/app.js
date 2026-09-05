import express from "express";
import cors from "cors";
import { supabase } from "./config/database.js";
import { env } from "./config/env.js";
import serviceRequestRoutes from "./routes/serviceRequest.routes.js";
import technicianRoutes from "./routes/technician.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

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
  }));
  
app.use(express.json());

app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/users", userRoutes);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

// Test Supabase connection
app.get("/api/db-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        success: false,
        message: "Supabase query failed",
        error: error.message,
      });
    }

    console.log("Users:", data);

    res.status(200).json({
      success: true,
      message: "Supabase connection successful",
      count: data.length,
      data,
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