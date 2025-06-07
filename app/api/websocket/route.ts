import type { NextRequest } from "next/server"

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

interface Client {
  userId: string
  username: string
  currentRoom?: string
  lastSeen: number
  joinedRooms: Set<string>
}

interface Room {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: number
  members: Set<string>
  isPrivate: boolean
  isPublic: boolean
}

// Enhanced in-memory storage
const clients = new Map<string, Client>()
const messages = new Map<string, Message[]>()
const typingUsers = new Map<string, Set<string>>()
const rooms = new Map<string, Room>()
const userRoomMemberships = new Map<string, Set<string>>() // userId -> Set of roomIds

// Initialize default rooms and messages
if (rooms.size === 0) {
  console.log("Initializing default rooms...")

  // Create default rooms
  rooms.set("general", {
    id: "general",
    name: "General",
    description: "General discussion for all developers",
    createdBy: "system",
    createdAt: Date.now(),
    members: new Set(),
    isPrivate: false,
    isPublic: true,
  })

  rooms.set("frontend", {
    id: "frontend",
    name: "Frontend Devs",
    description: "React, Vue, Angular, and all things frontend",
    createdBy: "system",
    createdAt: Date.now(),
    members: new Set(),
    isPrivate: false,
    isPublic: true,
  })

  rooms.set("backend", {
    id: "backend",
    name: "Backend Devs",
    description: "APIs, databases, servers, and backend architecture",
    createdBy: "system",
    createdAt: Date.now(),
    members: new Set(),
    isPrivate: false,
    isPublic: true,
  })

  rooms.set("mobile", {
    id: "mobile",
    name: "Mobile Development",
    description: "iOS, Android, React Native, Flutter discussions",
    createdBy: "system",
    createdAt: Date.now(),
    members: new Set(),
    isPrivate: false,
    isPublic: true,
  })

  rooms.set("devops", {
    id: "devops",
    name: "DevOps & Infrastructure",
    description: "CI/CD, Docker, Kubernetes, cloud platforms",
    createdBy: "system",
    createdAt: Date.now(),
    members: new Set(),
    isPrivate: false,
    isPublic: true,
  })

  // Add welcome messages for each room
  const welcomeMessages = {
    general: [
      {
        id: "welcome-general-1",
        user: "DevTea Bot",
        content:
          "Welcome to the General discussion room! 👋 This is where developers from all backgrounds come together to chat.",
        timestamp: Date.now() - 3600000,
        type: "room" as const,
        roomId: "general",
      },
      {
        id: "welcome-general-2",
        user: "DevTea Bot",
        content:
          "💡 Tip: You can join/leave rooms, create new ones, and send direct messages. Use the search to find rooms!",
        timestamp: Date.now() - 3500000,
        type: "room" as const,
        roomId: "general",
      },
    ],
    frontend: [
      {
        id: "welcome-frontend-1",
        user: "DevTea Bot",
        content:
          "Welcome to Frontend Devs! 🚀 Share your React, Vue, Angular tips and discuss the latest in frontend development.",
        timestamp: Date.now() - 3600000,
        type: "room" as const,
        roomId: "frontend",
      },
      {
        id: "welcome-frontend-2",
        user: "DevTea Bot",
        content: "🔥 Hot topics: Component libraries, state management, performance optimization, and modern CSS!",
        timestamp: Date.now() - 3400000,
        type: "room" as const,
        roomId: "frontend",
      },
    ],
    backend: [
      {
        id: "welcome-backend-1",
        user: "DevTea Bot",
        content:
          "Welcome to Backend Devs! 🔧 Discuss APIs, databases, server architecture, and backend best practices.",
        timestamp: Date.now() - 3600000,
        type: "room" as const,
        roomId: "backend",
      },
      {
        id: "welcome-backend-2",
        user: "DevTea Bot",
        content: "💾 Popular topics: Microservices, database design, API security, and scalability patterns!",
        timestamp: Date.now() - 3300000,
        type: "room" as const,
        roomId: "backend",
      },
    ],
    mobile: [
      {
        id: "welcome-mobile-1",
        user: "DevTea Bot",
        content:
          "Welcome to Mobile Development! 📱 Discuss iOS, Android, React Native, Flutter, and mobile best practices.",
        timestamp: Date.now() - 3600000,
        type: "room" as const,
        roomId: "mobile",
      },
    ],
    devops: [
      {
        id: "welcome-devops-1",
        user: "DevTea Bot",
        content:
          "Welcome to DevOps & Infrastructure! ⚙️ Share knowledge about CI/CD, containerization, and cloud platforms.",
        timestamp: Date.now() - 3600000,
        type: "room" as const,
        roomId: "devops",
      },
    ],
  }

  // Set welcome messages for each room
  Object.entries(welcomeMessages).forEach(([roomId, roomMessages]) => {
    messages.set(roomId, roomMessages)
  })

  console.log(`Initialized ${rooms.size} rooms with welcome messages`)
}

export async function GET(request: NextRequest) {
  const upgrade = request.headers.get("upgrade")
  if (upgrade !== "websocket") {
    return new Response("Expected websocket", { status: 400 })
  }
  return new Response("WebSocket upgrade not supported in development mode", { status: 501 })
}

export async function POST(request: NextRequest) {
  try {
    const { type, data, userId } = await request.json()
    console.log(`API Request: ${type}`, { userId, data })

    switch (type) {
      case "register":
        const existingClient = clients.get(data.userId)
        const existingRooms = userRoomMemberships.get(data.userId) || new Set()

        clients.set(data.userId, {
          userId: data.userId,
          username: data.username,
          lastSeen: Date.now(),
          joinedRooms: existingRooms,
        })

        // Restore user to their previously joined rooms
        existingRooms.forEach((roomId) => {
          const room = rooms.get(roomId)
          if (room) {
            room.members.add(data.userId)
          }
        })

        console.log(`User registered: ${data.username} (${data.userId}), restored to ${existingRooms.size} rooms`)

        return Response.json({
          success: true,
          type: "registered",
          data: {
            joinedRooms: Array.from(existingRooms),
            availableRooms: Array.from(rooms.keys()),
          },
        })

      case "join_room":
        const client = clients.get(userId)
        if (!client) {
          return Response.json({ success: false, error: "User not found" })
        }

        const room = rooms.get(data.roomId)
        if (!room) {
          return Response.json({ success: false, error: "Room not found" })
        }

        // Update client state
        client.currentRoom = data.roomId
        client.lastSeen = Date.now()
        room.members.add(userId)
        client.joinedRooms.add(data.roomId)

        // Persist membership
        if (!userRoomMemberships.has(userId)) {
          userRoomMemberships.set(userId, new Set())
        }
        userRoomMemberships.get(userId)!.add(data.roomId)

        const roomMessages = messages.get(data.roomId) || []
        console.log(`User ${client.username} joined room ${data.roomId}, found ${roomMessages.length} messages`)

        return Response.json({
          success: true,
          type: "room_joined",
          data: {
            roomId: data.roomId,
            messages: roomMessages,
            memberCount: room.members.size,
          },
        })

      case "leave_room":
        const leavingClient = clients.get(userId)
        if (!leavingClient) {
          return Response.json({ success: false, error: "User not found" })
        }

        const leavingRoom = rooms.get(data.roomId)
        if (!leavingRoom) {
          return Response.json({ success: false, error: "Room not found" })
        }

        leavingRoom.members.delete(userId)
        leavingClient.joinedRooms.delete(data.roomId)

        // Persist the leave
        const userMemberships = userRoomMemberships.get(userId)
        if (userMemberships) {
          userMemberships.delete(data.roomId)
        }

        if (leavingClient.currentRoom === data.roomId) {
          leavingClient.currentRoom = undefined
        }

        console.log(`User ${leavingClient.username} left room ${data.roomId}`)

        return Response.json({
          success: true,
          type: "room_left",
          data: { roomId: data.roomId, memberCount: leavingRoom.members.size },
        })

      case "send_message":
        console.log("=== API: Processing send_message ===")
        console.log("User ID:", userId)
        console.log("Message data:", data)

        const sender = clients.get(userId)
        if (!sender) {
          console.error("Sender not found:", userId)
          return Response.json({ success: false, error: "User not found" })
        }

        const newMessage: Message = {
          id: crypto.randomUUID(),
          user: data.username,
          content: data.content,
          timestamp: Date.now(),
          type: data.type,
          roomId: data.roomId,
          recipientId: data.recipientId,
        }

        if (data.type === "room") {
          console.log("Processing room message for room:", data.roomId)

          const targetRoom = rooms.get(data.roomId)
          if (!targetRoom) {
            console.error("Room not found:", data.roomId)
            console.log("Available rooms:", Array.from(rooms.keys()))
            return Response.json({ success: false, error: "Room not found" })
          }

          // If user is not in the room, add them (this helps with newly created rooms)
          if (!targetRoom.members.has(userId)) {
            console.log(`Auto-adding user ${userId} (${sender.username}) to room ${data.roomId} for messaging`)
            targetRoom.members.add(userId)

            // Also update client's joined rooms
            sender.joinedRooms.add(data.roomId)

            // Update persistent memberships
            if (!userRoomMemberships.has(userId)) {
              userRoomMemberships.set(userId, new Set())
            }
            userRoomMemberships.get(userId)!.add(data.roomId)
          }

          // Initialize message array if it doesn't exist
          if (!messages.has(data.roomId)) {
            console.log(`Initializing message array for room ${data.roomId}`)
            messages.set(data.roomId, [])
          }

          const roomMessages = messages.get(data.roomId) || []
          roomMessages.push(newMessage)
          messages.set(data.roomId, roomMessages)

          console.log(`Message added to room ${data.roomId}. Total messages: ${roomMessages.length}`)
          console.log(`Room ${data.roomId} members:`, Array.from(targetRoom.members))
        } else {
          // Direct message logic remains the same
          const dmId = getDMId(userId, data.recipientId)
          const dmMessages = messages.get(dmId) || []
          dmMessages.push(newMessage)
          messages.set(dmId, dmMessages)
          console.log(`DM sent from ${userId} to ${data.recipientId}: ${data.content}`)
        }

        console.log("Message processed successfully:", newMessage)
        return Response.json({
          success: true,
          type: "message_sent",
          data: newMessage,
        })

      case "get_messages":
        if (data.type === "room") {
          const requestingClient = clients.get(userId)
          const requestedRoom = rooms.get(data.roomId)

          if (!requestingClient || !requestedRoom) {
            return Response.json({ success: false, error: "Room or user not found" })
          }

          // Auto-join user to room if not already a member
          if (!requestedRoom.members.has(userId)) {
            requestedRoom.members.add(userId)
            requestingClient.joinedRooms.add(data.roomId)
            requestingClient.currentRoom = data.roomId

            // Update persistent memberships
            if (!userRoomMemberships.has(userId)) {
              userRoomMemberships.set(userId, new Set())
            }
            userRoomMemberships.get(userId)!.add(data.roomId)
          }

          // Initialize message array if it doesn't exist
          if (!messages.has(data.roomId)) {
            console.log(`Initializing empty message array for room ${data.roomId}`)
            messages.set(data.roomId, [])
          }

          const roomMessages = messages.get(data.roomId) || []
          return Response.json({
            success: true,
            type: "room_messages",
            data: { roomId: data.roomId, messages: roomMessages, memberCount: requestedRoom.members.size },
          })
        } else {
          // Direct messages
          const dmId = getDMId(userId, data.recipientId)
          const dmMessages = messages.get(dmId) || []
          return Response.json({
            success: true,
            type: "dm_messages",
            data: { recipientId: data.recipientId, messages: dmMessages },
          })
        }

      case "search_rooms":
        const query = data.query?.toLowerCase() || ""
        const searchResults = Array.from(rooms.values())
          .filter(
            (room) =>
              room.isPublic &&
              (room.name.toLowerCase().includes(query) ||
                room.description.toLowerCase().includes(query) ||
                room.id.toLowerCase().includes(query)),
          )
          .map((room) => ({
            id: room.id,
            name: room.name,
            description: room.description,
            memberCount: room.members.size,
            isMember: room.members.has(userId),
          }))

        return Response.json({
          success: true,
          type: "search_results",
          data: { rooms: searchResults, query },
        })

      case "create_room":
        const creator = clients.get(userId)
        if (!creator) {
          return Response.json({ success: false, error: "User not found" })
        }

        const roomId = data.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")

        if (rooms.has(roomId)) {
          return Response.json({ success: false, error: "Room already exists" })
        }

        const newRoom: Room = {
          id: roomId,
          name: data.name,
          description: data.description || "",
          createdBy: userId,
          createdAt: Date.now(),
          members: new Set([userId]),
          isPrivate: false,
          isPublic: true,
        }

        rooms.set(roomId, newRoom)
        creator.joinedRooms.add(roomId)
        creator.currentRoom = roomId

        // Persist membership for creator
        if (!userRoomMemberships.has(userId)) {
          userRoomMemberships.set(userId, new Set())
        }
        userRoomMemberships.get(userId)!.add(roomId)

        // Add welcome message to new room
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          user: "DevTea Bot",
          content: `Welcome to ${data.name}! 🎉 This room was created by ${creator.username}. ${data.description || "Start chatting!"}`,
          timestamp: Date.now(),
          type: "room",
          roomId: roomId,
        }

        messages.set(roomId, [welcomeMessage])
        console.log(
          `Room ${roomId} initialized with welcome message. Current rooms with messages:`,
          Array.from(messages.keys()),
        )

        console.log(`Room created: ${roomId} by ${creator.username}`)

        return Response.json({
          success: true,
          type: "room_created",
          data: {
            ...newRoom,
            members: Array.from(newRoom.members),
            memberCount: newRoom.members.size,
          },
        })

      case "get_rooms":
        const userClient = clients.get(userId)
        const publicRooms = Array.from(rooms.values())
          .filter((room) => room.isPublic)
          .map((room) => ({
            id: room.id,
            name: room.name,
            description: room.description,
            memberCount: room.members.size,
            isMember: userClient ? room.members.has(userId) : false,
            isJoined: userClient ? userClient.joinedRooms.has(room.id) : false,
          }))

        return Response.json({
          success: true,
          type: "rooms_list",
          data: { rooms: publicRooms },
        })

      case "get_joined_rooms":
        const joinedClient = clients.get(userId)
        if (!joinedClient) {
          return Response.json({ success: false, error: "User not found" })
        }

        const joinedRooms = Array.from(joinedClient.joinedRooms)
          .map((roomId) => rooms.get(roomId))
          .filter(Boolean)
          .map((room) => ({
            id: room!.id,
            name: room!.name,
            description: room!.description,
            memberCount: room!.members.size,
            isMember: true,
            isJoined: true,
          }))

        return Response.json({
          success: true,
          type: "joined_rooms",
          data: { rooms: joinedRooms },
        })

      case "edit_message":
        const editResult = editMessage(data.messageId, data.content, data.roomId, data.recipientId, userId)
        return Response.json(editResult)

      case "delete_message":
        const deleteResult = deleteMessage(data.messageId, data.roomId, data.recipientId, userId)
        return Response.json(deleteResult)

      case "get_online_users":
        const onlineUsers = Array.from(clients.values())
          .filter((client) => Date.now() - client.lastSeen < 300000) // 5 minutes
          .map((client) => ({
            userId: client.userId,
            username: client.username,
            currentRoom: client.currentRoom,
            joinedRooms: Array.from(client.joinedRooms),
          }))

        return Response.json({
          success: true,
          type: "online_users",
          data: { users: onlineUsers },
        })

      case "get_room_members":
        const targetRoom = rooms.get(data.roomId)
        if (!targetRoom) {
          return Response.json({ success: false, error: "Room not found" })
        }

        const members = Array.from(targetRoom.members)
          .map((memberId) => clients.get(memberId))
          .filter(Boolean)
          .map((member) => ({
            userId: member!.userId,
            username: member!.username,
            isOnline: Date.now() - member!.lastSeen < 300000,
          }))

        return Response.json({
          success: true,
          type: "room_members",
          data: { roomId: data.roomId, members },
        })

      default:
        return Response.json({ success: false, error: "Unknown message type" }, { status: 500 })
    }
  } catch (error) {
    console.error("WebSocket API error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

function getDMId(userId1: string, userId2: string) {
  return [userId1, userId2].sort().join("-dm-")
}

function editMessage(messageId: string, content: string, roomId?: string, recipientId?: string, userId?: string) {
  const targetId = roomId || getDMId(userId!, recipientId!)
  const targetMessages = messages.get(targetId) || []
  const messageIndex = targetMessages.findIndex((m) => m.id === messageId)

  if (messageIndex !== -1) {
    const message = targetMessages[messageIndex]
    const userClient = clients.get(userId!)

    if (message.user === userClient?.username) {
      targetMessages[messageIndex] = { ...message, content, edited: true }
      return {
        success: true,
        type: "message_edited",
        data: targetMessages[messageIndex],
      }
    }
  }

  return { success: false, error: "Message not found or unauthorized" }
}

function deleteMessage(messageId: string, roomId?: string, recipientId?: string, userId?: string) {
  const targetId = roomId || getDMId(userId!, recipientId!)
  const targetMessages = messages.get(targetId) || []
  const messageIndex = targetMessages.findIndex((m) => m.id === messageId)

  if (messageIndex !== -1) {
    const message = targetMessages[messageIndex]
    const userClient = clients.get(userId!)

    if (message.user === userClient?.username) {
      targetMessages.splice(messageIndex, 1)
      return {
        success: true,
        type: "message_deleted",
        data: { messageId },
      }
    }
  }

  return { success: false, error: "Message not found or unauthorized" }
}
