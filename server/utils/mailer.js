import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's free tier requires sending from their shared test domain unless you
// verify your own domain. This works immediately with no setup for testing/demo.
const FROM_ADDRESS = "CodeQuest <onboarding@resend.dev>";

export const sendOTPEmail = async ({ to, code, language }) => {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your verification code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px;">
          <h2>Verify your email</h2>
          <p>You requested to switch your language to <strong>${language}</strong>.</p>
          <p>Your verification code is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
          <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.log("Failed to send OTP email:", error.message);
    throw error;
  }
};

export const sendPaymentConfirmationEmail = async ({ to, name, plan, amount, invoiceNumber, invoicePdfBuffer }) => {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Payment Confirmed – ${plan.toUpperCase()} Plan Activated`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2>Payment Successful ✅</h2>
          <p>Hi ${name},</p>
          <p>Your payment for the <strong>${plan.toUpperCase()}</strong> plan has been received and your subscription is now active.</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding:4px 12px 4px 0; color:#666;">Invoice Number</td><td>${invoiceNumber}</td></tr>
            <tr><td style="padding:4px 12px 4px 0; color:#666;">Plan</td><td>${plan.toUpperCase()}</td></tr>
            <tr><td style="padding:4px 12px 4px 0; color:#666;">Amount</td><td>₹${amount}</td></tr>
          </table>
          <p>Your invoice is attached to this email. Thank you for subscribing!</p>
        </div>
      `,
      attachments: invoicePdfBuffer
        ? [{ filename: `${invoiceNumber}.pdf`, content: invoicePdfBuffer.toString("base64") }]
        : [],
    });
    console.log(`Confirmation email sent to ${to}`);
  } catch (error) {
    console.log("Failed to send confirmation email:", error.message);
  }
};

export const sendNewDeviceLoginEmail = async ({ to, name, browser, os, location, ip, code }) => {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "New login attempt — verification required",
      html: `
        <div style="font-family: sans-serif; max-width: 450px;">
          <h2>New device login attempt</h2>
          <p>Hi ${name},</p>
          <p>Someone just tried to log in to your account from a device we don't recognize:</p>
          <table style="border-collapse: collapse; margin: 12px 0; font-size: 14px;">
            <tr><td style="padding:4px 12px 4px 0; color:#666;">Browser</td><td>${browser}</td></tr>
            <tr><td style="padding:4px 12px 4px 0; color:#666;">OS</td><td>${os}</td></tr>
            <tr><td style="padding:4px 12px 4px 0; color:#666;">Location</td><td>${location.city}, ${location.country}</td></tr>
            <tr><td style="padding:4px 12px 4px 0; color:#666;">IP Address</td><td>${ip}</td></tr>
          </table>
          <p>If this was you, enter this verification code to continue:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
          <p style="color: #666; font-size: 13px;">If this wasn't you, someone may have your password — change it immediately and don't share this code.</p>
        </div>
      `,
    });
    console.log(`New-device login email sent to ${to}`);
  } catch (error) {
    console.log("Failed to send new-device login email:", error.message);
    throw error;
  }
};