import { expect, test } from "playwright/test";

test("create flow surfaces unverified-user blocking clearly", async ({ context, page }) => {
  await context.addCookies([
    {
      name: "e2e-bypass-auth",
      value: "1",
      url: "http://127.0.0.1:3010"
    }
  ]);
  await page.route("**/api/prep-packs", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: "Email verification required" })
    });
  });

  await page.goto("/create");
  await page.getByLabel("Company Name").fill("Infosys");
  await page.getByLabel("Role").fill("Frontend Developer");
  await page.getByLabel("Job Description").fill(
    "Build user interfaces, integrate APIs, debug issues, and collaborate with design and QA teams."
  );
  await page.getByRole("button", { name: "Generate Prep Pack" }).click();

  await expect(page.getByRole("main").getByText("Email verification required")).toBeVisible();
});

test("forgot-password screen handles invalid token style failures", async ({ page }) => {
  await page.route("**/api/auth/reset-password", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "Reset link expired or invalid" })
    });
  });

  await page.goto("/reset-password?token=expired-token");
  await page.getByLabel("New password").fill("StrongPass123!");
  await page.getByLabel("Confirm password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Reset Password" }).click();

  await expect(page.getByRole("main").getByText("Reset link expired or invalid")).toBeVisible();
});

test("signup screen shows rate-limit feedback", async ({ page }) => {
  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: "Too many requests. Please wait a moment and try again." })
    });
  });

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Aditi Sharma");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(
    page.getByRole("main").getByText("Too many requests. Please wait a moment and try again.")
  ).toBeVisible();
});
