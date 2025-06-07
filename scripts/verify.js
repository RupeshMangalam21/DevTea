#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

console.log("🔧 DevTea Repository Verification")
console.log("==================================\n")

// Required files checklist
const requiredFiles = [
  "package.json",
  "tsconfig.json",
  "next.config.mjs",
  "tailwind.config.ts",
  "postcss.config.js",
  "prettier.config.js",
  "eslint.config.js",
  ".gitignore",
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  ".env.example",
  ".env.local.example",
  ".env.production.example",
  "app/layout.tsx",
  "app/page.tsx",
  "app/globals.css",
  "app/api/health/route.ts",
  "app/api/auth/google/route.ts",
  "app/api/rooms/route.ts",
  "app/api/websocket/route.ts",
  "components/auth-provider.tsx",
  "components/google-auth.tsx",
  "components/sidebar.tsx",
  "components/profile-modal.tsx",
  "components/verification-panel.tsx",
  "lib/date-utils.ts",
]

// Check if files exist
const missingFiles = []
const presentFiles = []

console.log("📁 Checking required files...\n")

requiredFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
    presentFiles.push(file)
  } else {
    console.log(`❌ ${file} - MISSING`)
    missingFiles.push(file)
  }
})

console.log(`\n📊 File Check Summary:`)
console.log(`   ✅ Present: ${presentFiles.length}`)
console.log(`   ❌ Missing: ${missingFiles.length}`)

// Check package.json structure
if (fs.existsSync("package.json")) {
  console.log("\n📦 Checking package.json structure...")
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))

    const requiredFields = ["name", "version", "scripts", "dependencies", "devDependencies"]
    const requiredScripts = ["dev", "build", "start", "lint"]
    const requiredDeps = ["next", "react", "react-dom", "typescript"]

    requiredFields.forEach((field) => {
      if (pkg[field]) {
        console.log(`✅ ${field} field present`)
      } else {
        console.log(`❌ ${field} field missing`)
      }
    })

    requiredScripts.forEach((script) => {
      if (pkg.scripts && pkg.scripts[script]) {
        console.log(`✅ ${script} script present`)
      } else {
        console.log(`❌ ${script} script missing`)
      }
    })

    requiredDeps.forEach((dep) => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        console.log(`✅ ${dep} dependency present`)
      } else {
        console.log(`❌ ${dep} dependency missing`)
      }
    })
  } catch (error) {
    console.log("❌ Invalid package.json format")
  }
}

// Check environment files
console.log("\n🔐 Checking environment configuration...")

const envFiles = [".env.example", ".env.local.example", ".env.production.example"]
envFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`)
    try {
      const content = fs.readFileSync(file, "utf8")
      const requiredVars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "JWT_SECRET", "ALLOWED_ORIGINS"]

      requiredVars.forEach((envVar) => {
        if (content.includes(envVar)) {
          console.log(`   ✅ ${envVar} configured`)
        } else {
          console.log(`   ❌ ${envVar} missing`)
        }
      })
    } catch (error) {
      console.log(`   ❌ Error reading ${file}`)
    }
  }
})

// Check TypeScript configuration
console.log("\n🔧 Checking TypeScript configuration...")
if (fs.existsSync("tsconfig.json")) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"))
    if (tsconfig.compilerOptions) {
      console.log("✅ TypeScript configuration valid")
      if (tsconfig.compilerOptions.paths) {
        console.log("✅ Path mapping configured")
      }
      if (tsconfig.compilerOptions.strict) {
        console.log("✅ Strict mode enabled")
      }
    }
  } catch (error) {
    console.log("❌ Invalid tsconfig.json")
  }
}

// Check Next.js configuration
console.log("\n⚡ Checking Next.js configuration...")
if (fs.existsSync("next.config.mjs")) {
  console.log("✅ Next.js config exists")
  const content = fs.readFileSync("next.config.mjs", "utf8")
  if (content.includes("experimental")) {
    console.log("✅ Experimental features configured")
  }
  if (content.includes("images")) {
    console.log("✅ Image optimization configured")
  }
}

// Check Tailwind configuration
console.log("\n🎨 Checking Tailwind configuration...")
if (fs.existsSync("tailwind.config.ts")) {
  console.log("✅ Tailwind config exists")
  const content = fs.readFileSync("tailwind.config.ts", "utf8")
  if (content.includes("darkMode")) {
    console.log("✅ Dark mode configured")
  }
  if (content.includes("devtea")) {
    console.log("✅ Custom DevTea colors configured")
  }
}

// Final summary
console.log("\n🎉 Verification Complete!")
console.log("========================")

if (missingFiles.length === 0) {
  console.log("✅ All required files are present")
  console.log("✅ Repository is complete and ready for development")
  console.log("\n🚀 Next steps:")
  console.log("   1. npm install")
  console.log("   2. cp .env.local.example .env.local")
  console.log("   3. npm run dev")
  console.log("   4. Visit http://localhost:3000/verify")
} else {
  console.log(`❌ ${missingFiles.length} files are missing`)
  console.log("\n📋 Missing files:")
  missingFiles.forEach((file) => console.log(`   - ${file}`))
  console.log("\n🔧 Please ensure all required files are present before proceeding")
}

console.log("\n📖 For detailed setup instructions, see README.md")
console.log("🤝 For contributing guidelines, see CONTRIBUTING.md")
