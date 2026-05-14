import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodeBin = "C:\\Users\\vipul\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";
const port = 3012;
const baseUrl = `http://127.0.0.1:${port}`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(getLogs: () => string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(1000);
  }

  throw new Error(`API test server did not start in time\n${getLogs()}`);
}

async function main() {
  const server = spawn(
    nodeBin,
    ["./node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: workspaceRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NEXTAUTH_SECRET: "test-secret",
        NEXTAUTH_URL: baseUrl
      }
    }
  );

  let serverLogs = "";
  server.stdout.on("data", (chunk) => {
    serverLogs += String(chunk);
  });
  server.stderr.on("data", (chunk) => {
    serverLogs += String(chunk);
  });

  try {
    await waitForServer(() => serverLogs);

    const resetPassword = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "StrongPass123!" })
    });
    const resetPasswordPayload = await resetPassword.json();
    assert.equal(resetPassword.status, 400);
    assert.equal(resetPasswordPayload.error, "Reset token is required");
    console.log("PASS reset-password route rejects missing token");

    const signupCrossOrigin = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example"
      },
      body: JSON.stringify({
        name: "Student",
        email: "student@example.com",
        password: "StrongPass123!"
      })
    });
    const signupCrossOriginPayload = await signupCrossOrigin.json();
    assert.equal(signupCrossOrigin.status, 403);
    assert.equal(signupCrossOriginPayload.error, "Cross-origin request blocked");
    console.log("PASS signup route blocks cross-origin requests");

    const resetPasswordWrongType = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "token=test"
    });
    const resetPasswordWrongTypePayload = await resetPasswordWrongType.json();
    assert.equal(resetPasswordWrongType.status, 400);
    assert.equal(resetPasswordWrongTypePayload.error, "Content-Type must be application/json");
    console.log("PASS reset-password route rejects invalid content type");

    const prepQuestions = await fetch(`${baseUrl}/api/prep-packs/not-an-id/questions?category=React`);
    const prepQuestionsPayload = await prepQuestions.json();
    assert.equal(prepQuestions.status, 400);
    assert.match(prepQuestionsPayload.error, /Invalid prep pack id/);
    console.log("PASS prep questions route rejects invalid prep-pack id");

    const prepPacksInvalidStatus = await fetch(`${baseUrl}/api/prep-packs?status=not-real-status`);
    const prepPacksInvalidStatusPayload = await prepPacksInvalidStatus.json();
    assert.equal(prepPacksInvalidStatus.status, 401);
    assert.equal(prepPacksInvalidStatusPayload.error, "Unauthorized");
    console.log("PASS prep-packs route requires auth before applying filters");

    const detailedAnswer = await fetch(`${baseUrl}/api/questions/not-an-id/generate-detailed-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prepPackId: "507f1f77bcf86cd799439011",
        companyName: "TCS",
        role: "Frontend Developer",
        category: "React"
      })
    });
    const detailedAnswerPayload = await detailedAnswer.json();
    assert.equal(detailedAnswer.status, 400);
    assert.match(detailedAnswerPayload.error, /Invalid question id/);
    console.log("PASS detailed-answer route rejects invalid question id");

    const internalCron = await fetch(`${baseUrl}/api/internal/cron`, {
      method: "POST"
    });
    const internalCronPayload = await internalCron.json();
    assert.equal(internalCron.status, 401);
    assert.equal(internalCronPayload.error, "Unauthorized cron request");
    console.log("PASS internal cron route rejects unauthorized requests");

    console.log("Completed 7 API checks successfully.");
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

process.on("uncaughtException", (error) => {
  console.error(error);
  process.exit(1);
});
