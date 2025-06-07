#!/usr/bin/env node

console.log("🔒 DevTea Security Vulnerability Fix")
console.log("====================================\n")

const { execSync } = require("child_process")

console.log("📊 Checking current vulnerabilities...")
try {
  execSync("npm audit", { stdio: "inherit" })
} catch (error) {
  // npm audit returns non-zero exit code when vulnerabilities are found
}

console.log("\n🔧 Applying automatic fixes...")
try {
  execSync("npm audit fix", { stdio: "inherit" })
  console.log("✅ Automatic fixes applied")
} catch (error) {
  console.log("⚠️  Some issues require manual intervention")
}

console.log("\n📋 Checking remaining vulnerabilities...")
try {
  const auditResult = execSync("npm audit --json", { encoding: "utf8" })
  const audit = JSON.parse(auditResult)

  if (audit.metadata.vulnerabilities.total === 0) {
    console.log("✅ No vulnerabilities found!")
  } else {
    console.log(`⚠️  ${audit.metadata.vulnerabilities.total} vulnerabilities remaining`)
    console.log("   These may require manual review or package updates")
  }
} catch (error) {
  console.log("ℹ️  Run 'npm audit' manually to check status")
}

console.log("\n💡 Security Tips:")
console.log("   - Keep dependencies updated regularly")
console.log("   - Review security advisories for critical packages")
console.log("   - Use 'npm audit fix --force' only if you understand the risks")
console.log("   - Consider using 'npm ci' in production for reproducible builds")
