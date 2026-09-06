import {
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUserProfile,
} from "../services/auth.service.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    return res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    return res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Failed to refresh token",
    });
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    logoutUser(refreshToken);
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await getCurrentUserProfile(req.user.id);
    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "User profile not found",
    });
  }
}
