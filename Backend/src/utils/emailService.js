import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
});

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Full URL for password reset (e.g., https://yourapp.com/reset-password?token=...)
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const mailOptions = {
    from: `"NextPlore" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - NextPlore",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You have requested to reset your password for your NextPlore account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - NextPlore
      
      Hello,
      
      You have requested to reset your password for your NextPlore account.
      
      Click the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you did not request a password reset, please ignore this email or contact support if you have concerns.
      
      This is an automated message, please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send email verification code
 * @param {string} email - Recipient email address
 * @param {string} verificationCode - 6-digit verification code
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendVerificationEmail = async (email, verificationCode) => {
  const mailOptions = {
    from: `"NextPlore" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email Verification - NextPlore",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p>Hello,</p>
            <p>Thank you for registering with NextPlore. Please use the following code to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #007bff; color: #ffffff; padding: 15px 30px; border-radius: 5px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                ${verificationCode}
              </div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you did not register for a NextPlore account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Email Verification - NextPlore
      
      Hello,
      
      Thank you for registering with NextPlore. Please use the following code to verify your email address:
      
      ${verificationCode}
      
      This code will expire in 10 minutes.
      
      If you did not register for a NextPlore account, please ignore this email.
      
      This is an automated message, please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset code email
 * @param {string} email - Recipient email address
 * @param {string} resetCode - 6-digit password reset code
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendPasswordResetCode = async (email, resetCode) => {
  const mailOptions = {
    from: `"NextPlore" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Code - NextPlore",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You have requested to reset your password for your NextPlore account. Please use the following code to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #007bff; color: #ffffff; padding: 15px 30px; border-radius: 5px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                ${resetCode}
              </div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - NextPlore
      
      Hello,
      
      You have requested to reset your password for your NextPlore account. Please use the following code to reset your password:
      
      ${resetCode}
      
      This code will expire in 10 minutes.
      
      If you did not request a password reset, please ignore this email or contact support if you have concerns.
      
      This is an automated message, please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset code email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset code email:", error);
    throw new Error("Failed to send password reset code email");
  }
};

/**
 * Send account deletion verification code email
 * @param {string} email - Recipient email address
 * @param {string} deletionCode - 6-digit account deletion verification code
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendAccountDeletionCode = async (email, deletionCode) => {
  const mailOptions = {
    from: `"NextPlore" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Account Deletion Verification - NextPlore",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Deletion Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Account Deletion Verification</h2>
            <p>Hello,</p>
            <p>You have requested to delete your NextPlore account. Please use the following code to verify your identity:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #dc3545; color: #ffffff; padding: 15px 30px; border-radius: 5px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                ${deletionCode}
              </div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p style="color: #dc3545;"><strong>Warning:</strong> Deleting your account is permanent and cannot be undone. All your data will be permanently deleted.</p>
            <p>If you did not request to delete your account, please ignore this email or contact support immediately if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Account Deletion Verification - NextPlore
      
      Hello,
      
      You have requested to delete your NextPlore account. Please use the following code to verify your identity:
      
      ${deletionCode}
      
      This code will expire in 10 minutes.
      
      Warning: Deleting your account is permanent and cannot be undone. All your data will be permanently deleted.
      
      If you did not request to delete your account, please ignore this email or contact support immediately if you have concerns.
      
      This is an automated message, please do not reply to this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Account deletion verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending account deletion verification email:", error);
    throw new Error("Failed to send account deletion verification email");
  }
};

/**
 * Verify email transporter configuration
 * @returns {Promise<boolean>} - Returns true if configuration is valid
 */
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
};
