import express from "express";
import cors from "cors";
import { supabase } from "./config/database.js";

const app = express();

app.use(cors());
app.use(express.json());

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
      .from("devices")
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

export default app;