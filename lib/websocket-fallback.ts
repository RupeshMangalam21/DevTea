// WebSocket fallback for development environments
export class MockWebSocket {
  private listeners: { [key: string]: Function[] } = {}
  public readyState = 1 // OPEN

  constructor(url: string) {
    console.log(`Mock WebSocket connecting to: ${url}`)
    // Simulate connection delay
    setTimeout(() => {
      this.dispatchEvent("open", {})
    }, 100)
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  send(data: string) {
    console.log("Mock WebSocket send:", data)
    // Echo back for testing
    setTimeout(() => {
      this.dispatchEvent("message", { data: JSON.stringify({ type: "echo", data: JSON.parse(data) }) })
    }, 50)
  }

  close() {
    this.readyState = 3 // CLOSED
    this.dispatchEvent("close", {})
  }

  private dispatchEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }
}

// Enhanced WebSocket with fallback
export function createWebSocket(url: string): WebSocket {
  try {
    return new WebSocket(url)
  } catch (error) {
    console.warn("Native WebSocket not available, using mock implementation")
    return new MockWebSocket(url) as any
  }
}
