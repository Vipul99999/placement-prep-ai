import nodemailer from "nodemailer";
import { requireEnv } from "@/lib/env";

function createTransport() {
  return nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(requireEnv("SMTP_PORT")),
    secure: Number(requireEnv("SMTP_PORT")) === 465,
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS")
    }
  });
}

function wrapEmailShell(content: string) {
  return `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#fff8f1;color:#102027">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid rgba(16,32,39,0.08)">
          <p style="margin:0 0 8px;color:#0f766e;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700">PlacementPrep AI</p>
          ${content}
        </div>
      </div>
    `;
}

export async function sendPasswordResetEmail(args: {
  to: string;
  resetLink: string;
  recipientName?: string;
}) {
  const transporter = createTransport();
  const from = requireEnv("SMTP_FROM");

  await transporter.sendMail({
    from,
    to: args.to,
    subject: "Reset your PlacementPrep AI password",
    text: `Hi ${args.recipientName || "there"},\n\nUse this link to reset your password:\n${args.resetLink}\n\nThis link expires in 30 minutes.\n`,
    html: wrapEmailShell(`
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Reset your password</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Hi ${args.recipientName || "there"}, use the button below to reset your password. This link expires in 30 minutes.</p>
          <a href="${args.resetLink}" style="display:inline-block;background:linear-gradient(90deg,#ff7a59,#0f766e);color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Reset Password</a>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#425a60">If you did not request this, you can safely ignore this email.</p>
    `)
  });
}

export async function sendEmailVerificationEmail(args: {
  to: string;
  verificationLink: string;
  recipientName?: string;
}) {
  const transporter = createTransport();
  const from = requireEnv("SMTP_FROM");

  await transporter.sendMail({
    from,
    to: args.to,
    subject: "Verify your PlacementPrep AI email",
    text: `Hi ${args.recipientName || "there"},\n\nVerify your email to activate your PlacementPrep AI workspace:\n${args.verificationLink}\n\nThis link expires in 24 hours.\n`,
    html: wrapEmailShell(`
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Verify your email</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Hi ${args.recipientName || "there"}, confirm your email so only verified users can create prep packs, upload resumes, and use AI generation.</p>
          <a href="${args.verificationLink}" style="display:inline-block;background:linear-gradient(90deg,#0f766e,#0ea5e9);color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Verify Email</a>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#425a60">If you did not create this account, you can ignore this email.</p>
    `)
  });
}

export async function sendEmailChangeVerificationEmail(args: {
  to: string;
  verificationLink: string;
  recipientName?: string;
}) {
  const transporter = createTransport();
  const from = requireEnv("SMTP_FROM");

  await transporter.sendMail({
    from,
    to: args.to,
    subject: "Confirm your new PlacementPrep AI email",
    text: `Hi ${args.recipientName || "there"},\n\nUse this link to confirm your new email address:\n${args.verificationLink}\n\nThis link expires in 24 hours.\n`,
    html: wrapEmailShell(`
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Confirm your new email</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Hi ${args.recipientName || "there"}, use the button below to confirm your new email address for PlacementPrep AI.</p>
          <a href="${args.verificationLink}" style="display:inline-block;background:linear-gradient(90deg,#0f766e,#ff7a59);color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Confirm Email Change</a>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#425a60">If you did not request this change, you should reset your password and review active sessions.</p>
    `)
  });
}
