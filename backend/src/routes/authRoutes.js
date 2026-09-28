import express from "express";
import * as authController from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateUserRegister } from "../validations/userValidation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, validateUserRegister, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authController.logout);

// Forgot / reset
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

// Email verification
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authLimiter, authController.resendVerificationEmail);

// Google OAuth
router.post("/google", authLimiter, authController.googleAuth);

// Example protected route for testing
router.get("/admin-only", protect, authorizeRoles("admin"), (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin",
  });
});

export default router;
