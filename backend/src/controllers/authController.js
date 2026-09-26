import User from "../models/userModel.js";
import LawyerProfile from "../models/lawyerProfiles/lawyerProfileModel.js";
import AuthorityProfile from "../models/authorityProfileModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

// Generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, expertise, isFree, managedCategory } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    if (role === "authority") {
      const existingAuthority = await AuthorityProfile.findOne({
        managedCategory,
      });
      if (existingAuthority) {
        return res.status(409).json({
          success: false,
          message: "Authority already assigned to this category.",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    if (user.role === "lawyer") {
      await LawyerProfile.create({
        user: user._id,
        verificationStatus: "pending",
        ...(expertise && { expertise }),
        ...(typeof isFree === "boolean" && { isFree }),
      });
    }

    if (user.role === "authority") {
      try {
        await AuthorityProfile.create({
          user: user._id,
          managedCategory,
        });
      } catch (error) {
        await User.findByIdAndDelete(user._id);
        if (error.code === 11000) {
          return res.status(409).json({
            success: false,
            message: "Authority already assigned to this category.",
          });
        }
        throw error;
      }
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    (async () => {
      try {
        const [{ emailVerificationTemplate }, { sendEmail }] = await Promise.all([
          import("../services/email/emailVerificationTemplates.js"),
          import("../services/email/emailService.js"),
        ]);

        const { subject, html } = emailVerificationTemplate({
          name: user.name,
          verificationUrl,
        });

        await sendEmail({ to: email, subject, html });
      } catch (err) {
        console.error(
          "[Email] Failed to send email verification email:",
          err?.message || err,
        );
      }
    })();

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password: generate reset token and send email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether email exists
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link was sent",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Use shared email service and templates (non-blocking)
    (async () => {
      try {
        const [{ passwordResetTemplate }, { sendEmail }] = await Promise.all([
          import("../services/email/passwordEmailTemplates.js"),
          import("../services/email/emailService.js"),
        ]);

        const { subject, html } = passwordResetTemplate({
          name: user?.name || "",
          resetUrl,
        });

        await sendEmail({ to: email, subject, html });
      } catch (err) {
        // Log and continue — keep API response same as when email succeeds
        // eslint-disable-next-line no-console
        console.error(
          "[Email] Failed to send password reset email:",
          err?.message || err,
        );
      }
    })();

    return res.status(200).json({
      success: true,
      message: "If that email exists, a reset link was sent",
    });
  } catch (error) {
    next(error);
  }
};

// Reset password using token
export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Token, email and new password are required",
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password has been reset" });
  } catch (error) {
    next(error);
  }
};

// Verify email using token
export const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Token and email are required",
      });
    }

    const user = await User.findOne({
      email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Optionally generate token for auto-login
    const jwtToken = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token: jwtToken,
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a verification link was sent",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    (async () => {
      try {
        const [{ emailVerificationTemplate }, { sendEmail }] = await Promise.all([
          import("../services/email/emailVerificationTemplates.js"),
          import("../services/email/emailService.js"),
        ]);

        const { subject, html } = emailVerificationTemplate({
          name: user.name,
          verificationUrl,
        });

        await sendEmail({ to: email, subject, html });
      } catch (err) {
        console.error(
          "[Email] Failed to resend verification email:",
          err?.message || err,
        );
      }
    })();

    return res.status(200).json({
      success: true,
      message: "If that email exists, a verification link was sent",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { token, role } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Please select a role to complete registration.",
        });
      }

      user = await User.create({
        name,
        email,
        googleId,
        role,
        profilePhoto: picture,
        isEmailVerified: true,
      });
      
      // Initialize profiles for lawyer/authority if needed based on role (similar to standard register)
      if (role === "lawyer") {
        await LawyerProfile.create({ user: user._id });
      } else if (role === "authority") {
        await AuthorityProfile.create({ user: user._id });
      }
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Google Auth error:", error);
    res.status(500).json({ success: false, message: "Google authentication failed" });
  }
};
