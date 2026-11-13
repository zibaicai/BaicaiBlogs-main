import { expect, test } from "@playwright/test";

async function openDirectory(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.classList.contains("splash-seen"), null, { timeout: 10_000 }).catch(() => {});
  await page.locator(".archive-card--cover").first().waitFor({ timeout: 15_000 });
  await page.waitForTimeout(800);
}

test.describe("article directory card", () => {
  test("public card structure", async ({ page }) => {
    await openDirectory(page, "/articles?view=public");
    const card = page.locator(".archive-card--cover").first();
    await expect(card).toHaveScreenshot("article-card-public.png");
  });

  test("manage card structure", async ({ page, context }) => {
    const cookie = process.env.ADMIN_COOKIE;
    test.skip(!cookie, "ADMIN_COOKIE is required for the authenticated manage screenshot");

    await context.addCookies([
      {
        name: "BC_ADMIN_TOKEN",
        value: cookie!,
        domain: ".zibaicai.cn",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    ]);
    await openDirectory(page, "/articles/manage");
    const card = page.locator(".archive-card--cover").first();
    await expect(card).toHaveScreenshot("article-card-manage.png");
  });
});
