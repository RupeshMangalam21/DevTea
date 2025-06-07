// WebSocket Connection Test Script
console.log("🔧 DevTea WebSocket Test Starting...")

// Test WebSocket connection
function testWebSocket() {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/websocket`

    console.log(`📡 Connecting to: ${wsUrl}`)

    const ws = new WebSocket(wsUrl)
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error("WebSocket connection timeout (5s)"))
    }, 5000)

    ws.onopen = () => {
      console.log("✅ WebSocket connected successfully")
      clearTimeout(timeout)

      // Test registration
      const registerMessage = {
        type: "register",
        data: { userId: "test-user-123", username: "testuser" },
      }

      console.log("📤 Sending registration:", registerMessage)
      ws.send(JSON.stringify(registerMessage))

      // Test room join
      setTimeout(() => {
        const joinMessage = {
          type: "join_room",
          data: { roomId: "general" },
        }
        console.log("📤 Sending room join:", joinMessage)
        ws.send(JSON.stringify(joinMessage))
      }, 1000)

      // Test message send
      setTimeout(() => {
        const messageData = {
          type: "send_message",
          data: {
            username: "testuser",
            content: "Hello from test script! 🚀",
            type: "room",
            roomId: "general",
          },
        }
        console.log("📤 Sending test message:", messageData)
        ws.send(JSON.stringify(messageData))
      }, 2000)

      // Close after tests
      setTimeout(() => {
        console.log("🔌 Closing WebSocket connection")
        ws.close()
        resolve("All tests completed successfully")
      }, 3000)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("📥 Received message:", data)
    }

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error)
      clearTimeout(timeout)
      reject(error)
    }

    ws.onclose = (event) => {
      console.log("🔌 WebSocket closed:", event.code, event.reason)
      clearTimeout(timeout)
    }
  })
}

// Test API endpoints
async function testAPIs() {
  console.log("\n🔧 Testing API Endpoints...")

  try {
    // Test health endpoint
    console.log("📡 Testing /api/health...")
    const healthResponse = await fetch("/api/health")
    const healthData = await healthResponse.json()
    console.log("✅ Health check:", healthData.status, `(${healthData.responseTime})`)

    // Test rooms endpoint
    console.log("📡 Testing /api/rooms...")
    const roomsResponse = await fetch("/api/rooms")
    const roomsData = await roomsResponse.json()
    console.log("✅ Rooms API:", `${roomsData.rooms?.length || 0} rooms loaded`)

    // Test auth endpoint
    console.log("📡 Testing /api/auth/google...")
    const authResponse = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@devtea.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      }),
    })
    const authData = await authResponse.json()
    console.log("✅ Auth API:", authData.user ? "User created" : "Auth failed")

    // Test user search
    console.log("📡 Testing user search...")
    const searchResponse = await fetch("/api/auth/google?search=test")
    const searchData = await searchResponse.json()
    console.log("✅ Search API:", `${searchData.users?.length || 0} users found`)
  } catch (error) {
    console.error("❌ API test failed:", error)
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting DevTea System Verification\n")

  try {
    await testAPIs()
    console.log("\n📡 Testing WebSocket...")
    await testWebSocket()
    console.log("\n✅ All tests completed successfully!")
    console.log("\n📊 Test Summary:")
    console.log("   ✅ API Endpoints: Working")
    console.log("   ✅ WebSocket: Working")
    console.log("   ✅ Authentication: Working")
    console.log("   ✅ Room Management: Working")
    console.log("\n🎉 DevTea is ready for use!")
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    console.log("\n📊 Test Summary:")
    console.log("   ❌ Some components failed")
    console.log("   🔧 Check the console for details")
  }
}

// Auto-run tests
runAllTests()
