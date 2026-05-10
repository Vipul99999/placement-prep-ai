import { expect, test } from "playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "e2e-bypass-auth",
      value: "1",
      url: "http://127.0.0.1:3010"
    }
  ]);
});

test("create flow uploads resume and starts prep pack generation", async ({ page }) => {
  const prepPackId = "507f1f77bcf86cd799439011";

  await page.route("**/api/uploads/resume", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        _id: "507f191e810c19729de860ea",
        fileName: "resume.txt",
        extractedTextPreview: "Built a React dashboard and improved API debugging.",
        projectHighlights: ["Built a React dashboard", "Improved API debugging"]
      })
    });
  });

  await page.route("**/api/prep-packs", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ prepPackId })
    });
  });

  await page.route(`**/prep/${prepPackId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body><h1>Mock Prep Pack</h1></body></html>"
    });
  });

  await page.goto("/create");
  await page.getByLabel("Company Name").fill("TCS");
  await page.getByLabel("Role").fill("Frontend Developer");
  await page.getByLabel("Job Description").fill(
    "Build responsive React interfaces, work with APIs, debug issues, and collaborate with product and QA teams."
  );

  await page.setInputFiles('input[type="file"]', {
    name: "resume.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Built a React dashboard\nImproved API debugging\nWorked with JavaScript and CSS")
  });

  await expect(page.getByText("resume.txt")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate Prep Pack" })).toBeEnabled();
  const prepRequest = page.waitForRequest(
    (request) => request.url().includes("/api/prep-packs") && request.method() === "POST"
  );
  await page.getByRole("button", { name: "Generate Prep Pack" }).click();
  await prepRequest;
  await expect(page.getByText("Prep pack ready")).toBeVisible();
});
