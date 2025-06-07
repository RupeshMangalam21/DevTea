#!/usr/bin/env node

console.log("🔧 DevTea Post-Install Setup")
console.log("============================\n")

const fs = require("fs")
const { execSync } = require("child_process")

// Check if .env.local exists
if (!fs.existsSync(".env.local")) {
  console.log("📝 Creating .env.local from example...")
  try {
    if (fs.existsSync(".env.local.example")) {
      fs.copyFileSync(".env.local.example", ".env.local")
      console.log("✅ .env.local created successfully")
    } else {
      console.log("⚠️  .env.local.example not found, creating basic .env.local...")
      const basicEnv = `# DevTea Environment Variables
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=${require("crypto").randomBytes(64).toString("hex")}
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
DEBUG=true
MOCK_GOOGLE_AUTH=true
`
      fs.writeFileSync(".env.local", basicEnv)
      console.log("✅ Basic .env.local created")
    }
  } catch (error) {
    console.log("❌ Failed to create .env.local:", error.message)
  }
} else {
  console.log("✅ .env.local already exists")
}

// Check Node.js version
console.log("\n🔍 Checking system requirements...")
const nodeVersion = process.version
console.log(`Node.js version: ${nodeVersion}`)

if (Number.parseInt(nodeVersion.slice(1)) < 18) {
  console.log("⚠️  Warning: Node.js 18+ is recommended")
} else {
  console.log("✅ Node.js version is compatible")
}

// Run security audit fix for non-breaking changes
console.log("\n🔒 Fixing security vulnerabilities...")
try {
  execSync("npm audit fix", { stdio: "inherit" })
  console.log("✅ Security vulnerabilities fixed")
} catch (error) {
  console.log("⚠️  Some vulnerabilities require manual review")
  console.log("   Run 'npm audit' to see details")
}

console.log("\n🎉 Setup complete!")
console.log("\n📋 Next steps:")
console.log("   1. npm run dev")
console.log("   2. Visit http://localhost:3000")
console.log("   3. Visit http://localhost:3000/verify to test everything")
console.log("\n💡 Tips:")
console.log("   - Edit .env.local to add your real API keys")
console.log("   - The app works with mock authentication by default")
console.log("   - Check README.md for detailed setup instructions")
