import { cp, mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { detailRoutes } from "../mobile/routes.mjs";
import { validateApiOrigin } from "../mobile/api-url.mjs";
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = path.join(root, ".mobile-build");
require("@next/env").loadEnvConfig(root, false);
try { process.loadEnvFile(path.join(root, ".env.mobile.local")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const apiOrigin = validateApiOrigin(process.env.NEXT_PUBLIC_MOBILE_API_URL);
process.env.NEXT_PUBLIC_MOBILE_API_URL = apiOrigin;
process.env.NEXT_PUBLIC_API_URL = apiOrigin;
process.env.NEXT_PUBLIC_SOCKET_URL ||= apiOrigin;
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.NEXT_PUBLIC_MOBILE_BUILD = "true";
// Only replace the generated staging directory, never the website source.
if (path.dirname(stage) !== root || path.basename(stage) !== ".mobile-build") throw new Error("Unsafe staging directory");
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
for (const entry of ["src", "public", "package.json", "package-lock.json", "jsconfig.json", "postcss.config.mjs"]) {
  await cp(path.join(root, entry), path.join(stage, entry), { recursive: true });
}
for (const entry of ["src/proxy.js", "src/app/sitemap.js", "src/app/robots.js"]) {
  await rm(path.join(stage, entry), { force: true });
}
const config = {
  output: "export",
  outputFileTracingRoot: root,
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { cpus: 2 },
};
await writeFile(path.join(stage, "next.config.mjs"), "export default " + JSON.stringify(config, null, 2));
const mobileDir = path.join(stage, "src/mobile");
await cp(path.join(root, "mobile"), mobileDir, { recursive: true });
async function filesUnder(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await filesUnder(full));
    else result.push(full);
  }
  return result;
}
function replaceRequired(source, before, after, file) {
  if (!source.includes(before)) throw new Error("Mobile override no longer matches " + file + ": " + before);
  return source.replace(before, after);
}
const customer = path.join(stage, "src/app/(customer)");
for (const route of detailRoutes) {
  const parent = path.join(customer, route.path.slice(1));
  const page = path.join(parent, "[" + route.parameter + "]", "page.jsx");
  const original = await readFile(page, "utf8");
  if (!route.client) await writeFile(path.join(parent, "MobileDetailPage.jsx"), original);
  const componentPath = route.client ? "./[" + route.parameter + "]/" + route.client : "./MobileDetailPage";
  const content = '"use client";\nimport Component from "' + componentPath + '";\nimport { useParams } from "@/mobile/navigation";\nexport default function Page() { const params = useParams(); return <Component key={params.' + route.parameter + '} />; }\n';
  await writeFile(path.join(parent, "page.jsx"), content);
  await rm(page);
}
const sourceFiles = await filesUnder(path.join(stage, "src"));
for (const file of sourceFiles) {
  if (file.startsWith(mobileDir + path.sep) || !/\.(jsx?|tsx?)$/.test(file)) continue;
  const relative = path.relative(stage, file).replaceAll("\\", "/");
  if (/\[[^/]+\].*\/page\./.test(relative)) throw new Error("Unmapped mobile dynamic route: " + relative);
  let source = await readFile(file, "utf8");
  source = source.replace(/from (["'])next\/navigation\1/g, 'from "@/mobile/navigation"')
    .replace(/from (["'])next\/link\1/g, 'from "@/mobile/Link"')
    .replace(/from (["'])axios\1/g, 'from "@/mobile/axios"');
  if (relative === "src/app/lib/api.js") {
    const start = source.indexOf("// Add request interceptor");
    const end = source.indexOf("// Helper function", start);
    if (start < 0 || end < 0) throw new Error("Review api.js interceptor override");
    // The mobile axios adapter handles customer credentials and restricts them to the API origin.
    source = source.slice(0, start) + source.slice(end);
  }
  if (relative === "src/app/layout.jsx") {
    source = replaceRequired(source, "viewportFit: 'cover'", "viewportFit: 'contain'", relative);
    source = 'import { Suspense } from "react";\nimport NativeRuntime from "@/mobile/NativeRuntime";\n' + source;
    source = replaceRequired(source, "<ThemeProvider>", '<Suspense fallback={<div>Loading MelaChow…</div>}><NativeRuntime><ThemeProvider>', relative);
    source = replaceRequired(source, "</ThemeProvider>", "</ThemeProvider></NativeRuntime></Suspense>", relative);
  }
  if (relative.endsWith("/FoodDetailsClient.jsx") || relative.endsWith("/FoodDetailsModal.jsx")) {
    source = source.replaceAll("${window.location.origin}/food-details/", "https://www.melachow.com/food-details/");
  }
  if (relative.endsWith("/RestaurantClient.jsx")) {
    source = source.replaceAll("window.location.href", '("https://www.melachow.com/restaurants/" + vendorId)');
  }
  if (relative === "src/app/components/notifications/NotificationSettings.jsx") {
    source = replaceRequired(source, "Notifications are not available in this browser.",
      "Background notifications are not available yet. Open MelaChow to see your order updates.", relative);
  }
  const payments = {
    "src/app/(customer)/checkout/page.jsx": ["response", "order"],
    "src/app/(customer)/user/wallet/page.jsx": ["res", "wallet"],
    "src/app/(customer)/profile/wallet/page.jsx": ["res", "wallet"],
  };
  if (payments[relative]) {
    const [variable, kind] = payments[relative];
    source = replaceRequired(source, "window.location.href = " + variable + ".authorization_url;",
      'await (await import("@/mobile/payment")).openPayment(' + variable + ', "' + kind + '");', relative);
  }
  // Keep notification links and external role links inside the controlled navigation handler.
  source = source.replace(/window\.location\.href\s*=\s*([^;\n]+);/g, "window.__melachowNavigate($1);");
  await writeFile(file, source);
}
for (const target of [
  "src/app/components/InstallPWA.jsx",
  "src/app/components/PWA/PWAUpdateManager.jsx",
  "src/app/components/PWA/PWAInstallPrompt.jsx",
  "src/app/components/PermanentInstallButton.jsx",
  "src/app/components/notifications/PushNotificationPrompt.jsx",
]) {
  await cp(path.join(root, "mobile/empty-component.jsx"), path.join(stage, target));
}
await cp(path.join(root, "mobile/geolocation.js"), path.join(stage, "src/app/lib/deliveryGeolocation.js"));
await cp(path.join(root, "mobile/usePushNotifications.js"), path.join(stage, "src/app/hooks/usePushNotifications.js"));
const pwa = path.join(stage, "src/app/lib/pwa-utils.js");
let pwaSource = await readFile(pwa, "utf8");
pwaSource = replaceRequired(pwaSource, "export async function registerServiceWorker()", "export async function registerServiceWorker()", "pwa-utils.js");
pwaSource = pwaSource.replace(/(export async function registerServiceWorker\(\)\s*\{)/, "$1\n    return null;");
await writeFile(pwa, pwaSource);
// Use webpack explicitly: predictable resolution from this generated Next.js project.
const result = spawnSync(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build", stage, "--webpack"], {
  cwd: root, stdio: "inherit", env: process.env,
});
if (result.status !== 0) process.exit(result.status || 1);
await readFile(path.join(stage, "out/index.html"));
console.log("Customer mobile bundle ready: .mobile-build/out");
