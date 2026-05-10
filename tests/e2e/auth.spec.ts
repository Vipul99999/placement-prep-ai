import { expect, test } from "playwright/test";

test("signup redirects to verification sent screen", async ({ page }) => {
  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ userId: "507f1f77bcf86cd799439011", verificationSent: true })
    });
  });

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Aditi Sharma");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/verify-email\/sent\?email=student%40example\.com$/);
  await expect(page.getByRole("heading", { name: "Check your inbox before continuing." })).toBeVisible();
});

test("forgot password flow shows confirmation", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "If this email exists, a reset email has been sent." })
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByRole("button", { name: "Send Reset Link" }).click();

  await expect(
    page.getByRole("main").getByText("If this email exists, a reset email has been sent.")
  ).toBeVisible();
});

test("reset password flow redirects to login after success", async ({ page }) => {
  await page.route("**/api/auth/reset-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.goto("/reset-password?token=test-token");
  await page.getByLabel("New password").fill("NewStrongPass123!");
  await page.getByLabel("Confirm password").fill("NewStrongPass123!");
  await page.getByRole("button", { name: "Reset Password" }).click();

  await expect(page.getByText("Password reset successful. Redirecting to login...")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
