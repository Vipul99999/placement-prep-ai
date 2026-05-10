import { expect, test } from "playwright/test";

test("resend verification request shows confirmation", async ({ page }) => {
  await page.route("**/api/auth/resend-verification", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "If this account exists and is still unverified, a fresh verification email has been sent."
      })
    });
  });

  await page.goto("/verify-email/sent?email=student@example.com");
  await page.getByRole("button", { name: "Resend Verification Email" }).click();

  await expect(
    page
      .getByRole("main")
      .getByText("If this account exists and is still unverified, a fresh verification email has been sent.")
  ).toBeVisible();
});
