import crypto from "crypto";
import { compare, hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { validateEmail } from "@/lib/validators";
import type { AccountSessionSummary } from "@/types/prep";

const MAX_ACTIVE_SESSIONS = 10;

function getDeviceLabel(userAgent: string) {
  const normalized = userAgent.toLowerCase();
  if (normalized.includes("mobile")) {
    return "Mobile browser";
  }
  if (normalized.includes("chrome")) {
    return "Chrome browser";
  }
  if (normalized.includes("firefox")) {
    return "Firefox browser";
  }
  if (normalized.includes("safari")) {
    return "Safari browser";
  }
  return "Browser session";
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const db = await getDb();
  const normalizedEmail = input.email.toLowerCase().trim();
  const normalizedName = input.name.trim();

  if (!normalizedName || normalizedName.length > 80) {
    throw new Error("Name is required and must be under 80 characters");
  }

  const existing = await db.collection("users").findOne({ email: normalizedEmail });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hash(input.password, 10);
  const now = new Date();

  const result = await db.collection("users").insertOne({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    emailVerifiedAt: null,
    pendingEmail: "",
    twoFactorEnabled: false,
    createdAt: now,
    updatedAt: now
  });

  return {
    userId: result.insertedId.toString(),
    email: normalizedEmail,
    name: normalizedName
  };
}

export async function getUserProfile(userId: string) {
  const db = await getDb();
  const user = await db.collection("users").findOne<{
    _id: ObjectId;
    name?: string;
    email: string;
    emailVerifiedAt?: Date | null;
    createdAt?: Date;
    pendingEmail?: string;
    twoFactorEnabled?: boolean;
  }>({
    _id: new ObjectId(userId)
  });

  if (!user) {
    throw new Error("User account not found");
  }

  return {
    id: user._id.toString(),
    name: user.name ?? "",
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    pendingEmail: user.pendingEmail ?? "",
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    createdAt: user.createdAt?.toISOString() ?? ""
  };
}

export async function updateUserProfile(input: {
  userId: string;
  name: string;
}) {
  const db = await getDb();
  const normalizedName = input.name.trim();

  if (!normalizedName || normalizedName.length > 80) {
    throw new Error("Name is required and must be under 80 characters");
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(input.userId) },
    {
      $set: {
        name: normalizedName,
        updatedAt: new Date()
      }
    }
  );
}

export async function createEmailChangeToken(input: { userId: string; newEmail: string }) {
  const db = await getDb();
  const normalizedEmail = validateEmail(input.newEmail, "New email");
  const user = await db.collection("users").findOne<{
    _id: ObjectId;
    email: string;
    name?: string;
  }>({
    _id: new ObjectId(input.userId)
  });

  if (!user) {
    throw new Error("User account not found");
  }

  if (user.email === normalizedEmail) {
    throw new Error("New email must be different from your current email");
  }

  const existing = await db.collection("users").findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  await db.collection("emailChangeTokens").deleteMany({ userId: user._id });
  await db.collection("emailChangeTokens").insertOne({
    userId: user._id,
    newEmail: normalizedEmail,
    tokenHash,
    createdAt: now,
    expiresAt
  });

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        pendingEmail: normalizedEmail,
        updatedAt: now
      }
    }
  );

  return {
    token,
    currentEmail: user.email,
    newEmail: normalizedEmail,
    name: user.name ?? user.email.split("@")[0]
  };
}

export async function verifyEmailChangeToken(token: string) {
  const db = await getDb();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const emailChange = await db.collection("emailChangeTokens").findOne<{
    _id: ObjectId;
    userId: ObjectId;
    newEmail: string;
    expiresAt: Date;
  }>({
    tokenHash
  });

  if (!emailChange || emailChange.expiresAt.getTime() < Date.now()) {
    throw new Error("Email change link expired or invalid");
  }

  const alreadyUsed = await db.collection("users").findOne({ email: emailChange.newEmail });
  if (alreadyUsed) {
    throw new Error("An account with this email already exists");
  }

  await db.collection("users").updateOne(
    { _id: emailChange.userId },
    {
      $set: {
        email: emailChange.newEmail,
        pendingEmail: "",
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  await db.collection("emailChangeTokens").deleteMany({ userId: emailChange.userId });
}

export async function verifyUserPassword(email: string, password: string) {
  const db = await getDb();
  const user = await db.collection("users").findOne<{
    _id: { toString(): string };
    email: string;
    emailVerifiedAt?: Date | null;
    passwordHash?: string;
  }>({
    email: email.toLowerCase().trim()
  });

  if (!user?.passwordHash || !user.emailVerifiedAt) {
    return null;
  }

  const valid = await compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function changeUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const db = await getDb();
  const user = await db.collection("users").findOne<{
    _id: { toString(): string };
    email: string;
    passwordHash?: string;
  }>({
    _id: new ObjectId(input.userId)
  });

  if (!user?.passwordHash) {
    throw new Error("User account not found");
  }

  const valid = await compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await hash(input.newPassword, 10);

  await db.collection("users").updateOne(
    { _id: new ObjectId(input.userId) },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  );
  await db.collection("userSessions").deleteMany({ userId: new ObjectId(input.userId) });
}

export async function createPasswordResetToken(email: string) {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.collection("users").findOne<{ _id: ObjectId }>({
    email: normalizedEmail
  });

  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 30);

  await db.collection("passwordResetTokens").deleteMany({ userId: user._id });
  await db.collection("passwordResetTokens").insertOne({
    userId: user._id,
    tokenHash,
    createdAt: now,
    expiresAt
  });

  return token;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const db = await getDb();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await db.collection("passwordResetTokens").findOne<{
    _id: ObjectId;
    userId: ObjectId;
    expiresAt: Date;
  }>({
    tokenHash
  });

  if (!resetToken || resetToken.expiresAt.getTime() < Date.now()) {
    throw new Error("Reset link expired or invalid");
  }

  const passwordHash = await hash(password, 10);

  await db.collection("users").updateOne(
    { _id: resetToken.userId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  );
  await db.collection("userSessions").deleteMany({ userId: resetToken.userId });

  await db.collection("passwordResetTokens").deleteOne({ _id: resetToken._id });
}

export async function createEmailVerificationToken(email: string) {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.collection("users").findOne<{
    _id: ObjectId;
    name?: string;
    email: string;
    emailVerifiedAt?: Date | null;
  }>({
    email: normalizedEmail
  });

  if (!user || user.emailVerifiedAt) {
    return null;
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  await db.collection("emailVerificationTokens").deleteMany({ userId: user._id });
  await db.collection("emailVerificationTokens").insertOne({
    userId: user._id,
    tokenHash,
    createdAt: now,
    expiresAt
  });

  return {
    token,
    email: user.email,
    name: user.name ?? user.email.split("@")[0]
  };
}

export async function verifyEmailWithToken(token: string) {
  const db = await getDb();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const verificationToken = await db.collection("emailVerificationTokens").findOne<{
    _id: ObjectId;
    userId: ObjectId;
    expiresAt: Date;
  }>({
    tokenHash
  });

  if (!verificationToken || verificationToken.expiresAt.getTime() < Date.now()) {
    throw new Error("Verification link expired or invalid");
  }

  await db.collection("users").updateOne(
    { _id: verificationToken.userId },
    {
      $set: {
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  await db.collection("emailVerificationTokens").deleteMany({ userId: verificationToken.userId });
}

export async function getVerificationStatus(email: string) {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.collection("users").findOne<{
    _id: ObjectId;
    emailVerifiedAt?: Date | null;
  }>({
    email: normalizedEmail
  });

  return {
    exists: Boolean(user),
    emailVerified: Boolean(user?.emailVerifiedAt)
  };
}

export async function registerUserSession(input: {
  userId: string;
  sessionId: string;
  userAgent: string;
}) {
  const db = await getDb();
  const now = new Date();
  await db.collection("userSessions").updateOne(
    {
      sessionId: input.sessionId
    },
    {
      $set: {
        userId: new ObjectId(input.userId),
        userAgent: input.userAgent.slice(0, 240),
        deviceLabel: getDeviceLabel(input.userAgent),
        lastSeenAt: now,
        updatedAt: now,
        revokedAt: null
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  const activeSessions = await db
    .collection("userSessions")
    .find({
      userId: new ObjectId(input.userId),
      revokedAt: null
    })
    .sort({ lastSeenAt: -1, createdAt: -1 })
    .toArray();

  const overflowSessions = activeSessions.slice(MAX_ACTIVE_SESSIONS);
  if (overflowSessions.length) {
    await db.collection("userSessions").updateMany(
      {
        _id: {
          $in: overflowSessions.map((session) => session._id)
        }
      },
      {
        $set: {
          revokedAt: now,
          updatedAt: now
        }
      }
    );
  }
}

export async function touchUserSession(input: { userId: string; sessionId: string }) {
  const db = await getDb();
  const existing = await db.collection("userSessions").findOne<{
    revokedAt?: Date | null;
  }>({
    sessionId: input.sessionId
  });

  if (existing?.revokedAt) {
    return false;
  }

  await db.collection("userSessions").updateOne(
    {
      sessionId: input.sessionId
    },
    {
      $set: {
        userId: new ObjectId(input.userId),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null
      },
      $setOnInsert: {
        createdAt: new Date(),
        userAgent: "Browser session",
        deviceLabel: "Browser session"
      }
    },
    {
      upsert: true
    }
  );

  return true;
}

export async function listUserSessions(userId: string, currentSessionId?: string) {
  const db = await getDb();
  const sessions = await db
    .collection("userSessions")
    .find({
      userId: new ObjectId(userId)
    })
    .sort({ lastSeenAt: -1 })
    .limit(12)
    .toArray();

  return sessions.map((session) => ({
    _id: session._id.toString(),
    sessionId: session.sessionId,
    userAgent: session.userAgent ?? "",
    deviceLabel: session.deviceLabel ?? "Browser session",
    lastSeenAt: session.lastSeenAt?.toISOString() ?? new Date().toISOString(),
    createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
    revokedAt: session.revokedAt ? session.revokedAt.toISOString() : undefined,
    current: currentSessionId ? session.sessionId === currentSessionId : false
  })) as AccountSessionSummary[];
}

export async function revokeUserSession(input: {
  userId: string;
  sessionId: string;
}) {
  const db = await getDb();
  await db.collection("userSessions").updateOne(
    {
      userId: new ObjectId(input.userId),
      sessionId: input.sessionId
    },
    {
      $set: {
        revokedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
}
