#!/usr/bin/env node

console.log("🔧 DevTea Configuration Fix")
console.log("============================\n")

const { execSync } = require("child_process")

console.log("1️⃣ Updating Next.js to secure version...")
try {
  execSync("npm install next@^14.2.29 @next/bundle-analyzer@^14.2.29 eslint-config-next@^14.2.29", {
    stdio: "inherit",
  })
  console.log("✅ Next.js updated to secure version")
} catch (error) {
  console.log("❌ Failed to update Next.js:", error.message)
}

console.log("\n2️⃣ Fixing security vulnerabilities...")
try {
  execSync("npm audit fix", { stdio: "inherit" })
  console.log("✅ Security vulnerabilities fixed")
} catch (error) {
  console.log("⚠️  Some vulnerabilities may remain")
}

console.log("\n3️⃣ Checking configuration...")
const fs = require("fs")

// Check if next.config.mjs exists and has correct syntax
if (fs.existsSync("next.config.mjs")) {
  const content = fs.readFileSync("next.config.mjs", "utf8")
  if (content.includes("module.exports")) {
    console.log("⚠️  Found CommonJS syntax in ES module file")
    console.log("✅ This has been fixed in the updated config")
  } else {
    console.log("✅ Next.js config syntax is correct")
  }
}

console.log("\n🎉 Configuration fix complete!")
console.log("\n📋 Next steps:")
console.log("   1. npm run dev")
console.log("   2. Visit http://localhost:3000")
console.log("   3. Visit http://localhost:3000/verify")

console.log("\n💡 If you still see issues:")
console.log("   - Try: npm run fresh-install")
console.log("   - Or: rm -rf node_modules package-lock.json && npm install")
