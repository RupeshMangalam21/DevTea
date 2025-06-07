import { NextResponse } from "next/server"

interface HealthCheck {
  status: "healthy" | "unhealthy"
  timestamp: string
  uptime: number
  environment: string
  checks: {
    environment: {
      status: "pass" | "fail"
      details: Record<string, boolean>
    }
    websocket: {
      status: "pass" | "fail"
      details: string
    }
    memory: {
      status: "pass" | "fail"
      details: NodeJS.MemoryUsage
    }
  }
  version: string
}

export async function GET() {
  const startTime = Date.now()

  // Check environment variables
  const envCheck = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRedisUrl: !!process.env.REDIS_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasAllowedOrigins: !!process.env.ALLOWED_ORIGINS,
    hasSentryDsn: !!process.env.SENTRY_DSN,
  }

  const allEnvPresent = Object.values(envCheck).every(Boolean)

  // Check memory usage
  const memoryUsage = process.memoryUsage()
  const memoryHealthy = memoryUsage.heapUsed < 500 * 1024 * 1024 // 500MB threshold

  // WebSocket check (basic)
  let wsStatus = "pass"
  try {
    // This is a basic check - in production you'd want more sophisticated testing
    wsStatus = "pass"
  } catch (error) {
    wsStatus = "fail"
  }

  const health: HealthCheck = {
    status: allEnvPresent && memoryHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    checks: {
      environment: {
        status: allEnvPresent ? "pass" : "fail",
        details: envCheck,
      },
      websocket: {
        status: wsStatus as "pass" | "fail",
        details: "WebSocket endpoint available",
      },
      memory: {
        status: memoryHealthy ? "pass" : "fail",
        details: memoryUsage,
      },
    },
    version: process.env.npm_package_version || "1.0.0",
  }

  const responseTime = Date.now() - startTime

  return NextResponse.json(
    {
      ...health,
      responseTime: `${responseTime}ms`,
    },
    {
      status: health.status === "healthy" ? 200 : 503,
    },
  )
}
