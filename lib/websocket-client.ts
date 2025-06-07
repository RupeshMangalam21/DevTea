import { debugLogger } from "@/components/debug-panel"

interface Message {
  id: string
  user: string
  content: string
  timestamp: number
  edited?: boolean
  roomId?: string
  recipientId?: string
  type: "room" | "dm"
}

interface Room {
  id: string
  name: string
  description: string
  memberCount: number
  isMember: boolean
  isJoined: boolean
}

export class DevTeaWebSocketClient {
  private userId: string
  private username: string
  private onMessage: (message: any) => void
  private pollInterval: NodeJS.Timeout | null = null
  private currentRoom: string | null = null
  private currentContext: { type: "room" | "dm"; id: string } | null = null
  private persistedRooms: Set<string> = new Set()
  private isConnected = false
  private retryCount = 0
  private maxRetries = 3

  constructor(userId: string, username: string, onMessage: (message: any) => void) {
    this.userId = userId
    this.username = username
    this.onMessage = onMessage
    debugLogger.log("info", "WebSocket", "Client initialized", { userId, username })
  }

  async connect() {
    debugLogger.log("info", "WebSocket", "Starting connection process...")
    this.isConnected = false
    this.retryCount = 0

    // Register user with retry logic
    const result = await this.sendMessageWithRetry("register", { userId: this.userId, username: this.username })

    if (result.success) {
      this.isConnected = true
      debugLogger.log("success", "WebSocket", "Connected successfully")

      // Restore joined rooms from registration response
      if (result.data?.joinedRooms) {
        this.persistedRooms = new Set(result.data.joinedRooms)
        debugLogger.log("info", "WebSocket", "Restored rooms", { rooms: Array.from(this.persistedRooms) })
      }

      // Start polling for updates
      this.startPolling()
      this.onMessage({ type: "connected", data: { joinedRooms: Array.from(this.persistedRooms) } })
    } else {
      debugLogger.log("error", "WebSocket", "Failed to register user", result.error)
      this.onMessage({ type: "connection_failed", data: { error: result.error } })
    }
  }

  async sendMessage(type: string, data: any) {
    if (!this.isConnected && type !== "register") {
      debugLogger.log("warning", "WebSocket", "Client not connected, attempting to reconnect...")
      await this.connect()
    }

    try {
      debugLogger.log("info", "API", `Sending ${type}`, { data, userId: this.userId })

      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        debugLogger.log("warning", "API", `Request timeout for ${type}`)
      }, 10000) // 10 second timeout

      const startTime = Date.now()
      const response = await fetch("/api/websocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data, userId: this.userId }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      debugLogger.log("success", "API", `Response for ${type} (${responseTime}ms)`, result)

      if (result.success && result.type) {
        this.onMessage(result)
      }

      // Reset retry count on successful request
      this.retryCount = 0
      return result
    } catch (error: any) {
      debugLogger.log("error", "API", `Error in ${type}`, {
        error: error.message,
        name: error.name,
        stack: error.stack,
      })

      // Handle specific error types
      if (error.name === "AbortError") {
        return { success: false, error: "Request timeout" }
      }

      if (
        error.message.includes("ERR_INTERNET_DISCONNECTED") ||
        error.message.includes("ERR_NETWORK") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        this.isConnected = false
        debugLogger.log("error", "Network", "Connection lost", error.message)
        this.onMessage({ type: "connection_lost", data: { error: error.message } })
        return { success: false, error: "Network connection lost" }
      }

      return { success: false, error: error.message }
    }
  }

  async sendMessageWithRetry(type: string, data: any, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      debugLogger.log("info", "Retry", `Attempt ${attempt}/${maxRetries} for ${type}`)

      const result = await this.sendMessage(type, data)

      if (result.success) {
        if (attempt > 1) {
          debugLogger.log("success", "Retry", `${type} succeeded on attempt ${attempt}`)
        }
        return result
      }

      // If it's a network error and we have retries left, wait and try again
      if (
        attempt < maxRetries &&
        (result.error?.includes("Network") ||
          result.error?.includes("timeout") ||
          result.error?.includes("disconnected"))
      ) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff, max 5s
        debugLogger.log("warning", "Retry", `Retrying ${type} in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      debugLogger.log("error", "Retry", `${type} failed after ${attempt} attempts`, result.error)
      return result
    }

    return { success: false, error: "Max retries exceeded" }
  }

  async joinRoom(roomId: string) {
    debugLogger.log("info", "Room", `Joining room: ${roomId}`)
    this.currentRoom = roomId
    this.currentContext = { type: "room", id: roomId }
    this.persistedRooms.add(roomId)
    return this.sendMessageWithRetry("join_room", { roomId })
  }

  async leaveRoom(roomId: string) {
    debugLogger.log("info", "Room", `Leaving room: ${roomId}`)
    const result = await this.sendMessageWithRetry("leave_room", { roomId })

    if (result.success) {
      this.persistedRooms.delete(roomId)
      if (this.currentRoom === roomId) {
        this.currentRoom = null
        this.currentContext = null
      }
      debugLogger.log("success", "Room", `Left room: ${roomId}`)
    }

    return result
  }

  async searchRooms(query: string) {
    debugLogger.log("info", "Search", `Searching rooms: ${query}`)
    return this.sendMessageWithRetry("search_rooms", { query })
  }

  async createRoom(name: string, description: string) {
    debugLogger.log("info", "Room", `Creating room: ${name}`, { description })
    const result = await this.sendMessageWithRetry("create_room", { name, description })
    if (result.success && result.data?.id) {
      this.persistedRooms.add(result.data.id)
      debugLogger.log("success", "Room", `Room created: ${result.data.id}`)
    }
    return result
  }

  async getRooms() {
    return this.sendMessageWithRetry("get_rooms", {})
  }

  async getJoinedRooms() {
    return this.sendMessageWithRetry("get_joined_rooms", {})
  }

  async getRoomMembers(roomId: string) {
    return this.sendMessageWithRetry("get_room_members", { roomId })
  }

  async sendChatMessage(content: string, type: "room" | "dm", roomId?: string, recipientId?: string) {
    debugLogger.log("info", "Message", `Sending ${type} message`, {
      type,
      roomId,
      recipientId,
      contentLength: content.length,
    })

    // Add this validation to ensure we're sending to the correct room
    if (type === "room" && !roomId) {
      debugLogger.log("error", "Message", "Missing roomId for room message")
      return { success: false, error: "Missing roomId for room message" }
    }

    if (type === "dm" && !recipientId) {
      debugLogger.log("error", "Message", "Missing recipientId for DM")
      return { success: false, error: "Missing recipientId for DM" }
    }

    const messageData = {
      username: this.username,
      content,
      type,
      roomId,
      recipientId,
    }

    const result = await this.sendMessageWithRetry("send_message", messageData)
    if (result.success) {
      debugLogger.log("success", "Message", "Message sent successfully")
    }
    return result
  }

  async getMessages(type: "room" | "dm", roomId?: string, recipientId?: string) {
    debugLogger.log("info", "Messages", `Getting ${type} messages`, { roomId, recipientId })
    this.currentContext = { type, id: roomId || recipientId || "" }
    return this.sendMessageWithRetry("get_messages", { type, roomId, recipientId })
  }

  async editMessage(messageId: string, content: string, roomId?: string, recipientId?: string) {
    debugLogger.log("info", "Message", `Editing message: ${messageId}`)
    return this.sendMessageWithRetry("edit_message", { messageId, content, roomId, recipientId })
  }

  async deleteMessage(messageId: string, roomId?: string, recipientId?: string) {
    debugLogger.log("info", "Message", `Deleting message: ${messageId}`)
    return this.sendMessageWithRetry("delete_message", { messageId, roomId, recipientId })
  }

  async getOnlineUsers() {
    return this.sendMessage("get_online_users", {}) // Don't retry this as it's called frequently
  }

  getPersistedRooms(): string[] {
    return Array.from(this.persistedRooms)
  }

  private startPolling() {
    debugLogger.log("info", "Polling", "Starting message polling")
    // Poll for updates every 3 seconds (increased from 2s to reduce load)
    this.pollInterval = setInterval(async () => {
      if (!this.isConnected) {
        return
      }

      try {
        // Get latest messages for current context
        if (this.currentContext) {
          if (this.currentContext.type === "room") {
            const result = await this.sendMessage("get_messages", {
              type: "room",
              roomId: this.currentContext.id,
            })

            if (result.success && result.type === "room_messages") {
              this.onMessage({
                type: "room_messages_update",
                data: result.data,
              })
            } else if (!result.success && result.error?.includes("Network")) {
              debugLogger.log("warning", "Polling", "Network error during room polling")
            }
          } else if (this.currentContext.type === "dm") {
            const result = await this.sendMessage("get_messages", {
              type: "dm",
              recipientId: this.currentContext.id,
            })

            if (result.success && result.type === "dm_messages") {
              this.onMessage({
                type: "dm_messages_update",
                data: result.data,
              })
            }
          }
        }

        // Get online users periodically (less frequently)
        if (Math.random() < 0.3) {
          // Only 30% of the time to reduce load
          await this.getOnlineUsers()
        }
      } catch (error: any) {
        debugLogger.log("error", "Polling", "Polling error", error.message)
        // Don't mark as disconnected for polling errors
      }
    }, 3000)
  }

  async reconnect() {
    debugLogger.log("info", "WebSocket", "Manual reconnection requested")
    this.disconnect()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
    await this.connect()
  }

  disconnect() {
    debugLogger.log("info", "WebSocket", "Disconnecting client")
    this.isConnected = false
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.currentRoom = null
    this.currentContext = null
    this.onMessage({ type: "disconnected" })
  }
}
