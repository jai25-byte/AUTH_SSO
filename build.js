import { cp, mkdir } from "fs/promises";
import { existsSync } from "fs";

console.log("📦 Creating production build with Bun + Tailwind CSS v4...");

if (!existsSync("dist")) {
  await mkdir("dist", { recursive: true });
}

// 1. Minified JS build
const jsStart = performance.now();
const jsResult = await Bun.build({
  entrypoints: ["src/main.jsx"],
  outfile: "dist/bundle.js",
  target: "browser",
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

if (!jsResult.success) {
  console.error("❌ JS build failed:", jsResult.logs);
  process.exit(1);
}
console.log(`✅ [Bun.build] JS bundled & minified in ${Math.round(performance.now() - jsStart)}ms`);

// 2. Minified CSS build
const cssStart = performance.now();
const cssProc = Bun.spawn([
  "bunx",
  "@tailwindcss/cli",
  "-i",
  "src/index.css",
  "-o",
  "dist/styles.css",
  "--minify",
]);
await cssProc.exited;
console.log(`✅ [Tailwind] CSS compiled & minified in ${Math.round(performance.now() - cssStart)}ms`);

// 3. Copy index.html and assets
await cp("public/index.html", "dist/index.html");
await cp("public/wallpaper.png", "dist/wallpaper.png");

console.log("\n🎉 Production build complete! Distributable files are ready in ./dist/");
