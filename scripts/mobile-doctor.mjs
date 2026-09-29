import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const failures = [];
const major = Number(process.versions.node.split(".")[0]);
console.log("Node:", process.version);
if (major < 22) failures.push("Install Node.js 22 or newer.");
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Android/Sdk"));
console.log("Android SDK:", sdk && fs.existsSync(sdk) ? sdk : "not found");
if (!sdk || !fs.existsSync(path.join(sdk, "platforms/android-36/android.jar"))) {
  failures.push("Install Android SDK Platform 36 using Android Studio's SDK Manager; set ANDROID_HOME for a custom location.");
}
const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java") : "java";
const result = spawnSync(java, ["-version"], { encoding: "utf8" });
const output = (result.stderr || "") + (result.stdout || "");
const version = output.match(/version "(\d+)(?:\.(\d+))?/);
const javaMajor = version && Number(version[1] === "1" ? version[2] : version[1]);
console.log("Java:", javaMajor || "not found");
if (!javaMajor || javaMajor < 21) failures.push("Use Android Studio's bundled JDK 21 and set JAVA_HOME to its jbr directory.");
if (failures.length) {
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else console.log("Local Android build prerequisites found. Run npm run mobile:apk.");
