import { test, expect } from "@playwright/test";
const api = process.env.MOBILE_TEST_API_ORIGIN || "https://grubdash-api.onrender.com";
test.beforeEach(async ({ page }) => {
  // Never contact live accounts, payment providers, or upload services in smoke tests.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    if (url.origin === api) {
      if (url.pathname.includes("/auth/")) return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
      return route.fulfill({ status: 200, json: { success: true, foods: [], vendors: [], categories: [], reviews: [], data: [], notifications: [] } });
    }
    return route.abort();
  });
});
test("sign-in renders, API calls reach backend, and native build does not register service workers", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const profile = page.waitForRequest((request) => request.url().startsWith(api + "/api/user/auth/profile"));
  await page.goto("/auth/signin/");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await profile;
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  expect(errors).toEqual([]);
});
test("arbitrary food ID works on a cold load and after navigating to a different ID", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const firstFood = page.waitForRequest(api + "/v1/vendors/foods/not-baked-into-build");
  await page.goto("/food-details/?foodId=not-baked-into-build");
  await firstFood;
  await expect.poll(() => page.evaluate(() => typeof window.__melachowNavigate)).toBe("function");
  const secondFood = page.waitForRequest(api + "/v1/vendors/foods/another-new-id");
  await page.evaluate(() => window.__melachowNavigate("/food-details/another-new-id"));
  await secondFood;
  await expect(page).toHaveURL(/food-details\/\?foodId=another-new-id/);
  await page.reload();
  await expect.poll(() => page.evaluate(() => typeof window.__melachowNavigate)).toBe("function");
  expect(errors).toEqual([]);
});
test("guest navigation survives trailing slashes and client transitions", async ({ page }) => {
  await page.goto("/all-restaurants/");
  await expect.poll(() => page.evaluate(() => typeof window.__melachowNavigate)).toBe("function");
  await expect(page).toHaveURL(/all-restaurants\/$/);
  await page.evaluate(() => window.__melachowNavigate("/auth/signup"));
  await expect(page).toHaveURL(/auth\/signup\/$/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test("Next links navigate between exported authentication pages", async ({ page }) => {
  await page.goto("/auth/signin/");
  await page.locator('a[href="/auth/signup/"]').first().click();
  await expect(page).toHaveURL(/auth\/signup\/$/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
test("fetch sends the customer token only to the configured API", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("melachow_access_token_v1", "test-only-token"));
  await page.route(api + "/api/user/auth/profile", (route) => route.fulfill({
    json: { user: { _id: "test-user", role: "user", email: "test@example.invalid", addresses: [] } },
  }));
  await page.goto("/auth/signin/");
  await expect.poll(() => page.evaluate(() => typeof window.__melachowNavigate)).toBe("function");
  const ownRequest = page.waitForRequest(api + "/api/mobile-smoke");
  await page.evaluate(() => fetch("/api/mobile-smoke"));
  expect((await ownRequest).headers().authorization).toBe("Bearer test-only-token");
  const otherRequest = page.waitForRequest("https://external.example/api/mobile-smoke");
  await page.evaluate(() => fetch("https://external.example/api/mobile-smoke").catch(() => {}));
  expect((await otherRequest).headers().authorization).toBeUndefined();
});
