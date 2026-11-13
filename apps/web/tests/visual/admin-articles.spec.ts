import { expect, test } from "@playwright/test";

test.describe("admin article list", () => {
  test("uses the same note-style columns", async ({ page, context }) => {
    const cookie = process.env.ADMIN_COOKIE;
    test.skip(!cookie, "ADMIN_COOKIE is required for the authenticated admin screenshot");

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

    await page.goto("https://admin.zibaicai.cn/articles", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "文章管理" })).toBeVisible({ timeout: 15_000 });
    await page.locator("table thead th").first().waitFor({ timeout: 10_000 });

    const headers = (await page.locator("table thead th").allTextContents()).map((text) => text.trim());
    expect(headers).toEqual(["标题", "状态", "简介", "更新时间", "操作"]);
    await expect(page.locator("table thead").getByText("分类", { exact: true })).toHaveCount(0);
    await expect(page.locator("table thead").getByText("标签", { exact: true })).toHaveCount(0);
  });
});
