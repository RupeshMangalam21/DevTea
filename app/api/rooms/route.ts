import { type NextRequest, NextResponse } from "next/server"

interface Room {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: number
  members: string[]
  isPrivate: boolean
}

// Simple in-memory room storage
const rooms = new Map<string, Room>()

// Create some default rooms
rooms.set("general", {
  id: "general",
  name: "General",
  description: "General discussion for all developers",
  createdBy: "system",
  createdAt: Date.now(),
  members: [],
  isPrivate: false,
})

rooms.set("frontend", {
  id: "frontend",
  name: "Frontend Devs",
  description: "React, Vue, Angular, and all things frontend",
  createdBy: "system",
  createdAt: Date.now(),
  members: [],
  isPrivate: false,
})

rooms.set("backend", {
  id: "backend",
  name: "Backend Devs",
  description: "APIs, databases, servers, and backend architecture",
  createdBy: "system",
  createdAt: Date.now(),
  members: [],
  isPrivate: false,
})

export async function GET() {
  const publicRooms = Array.from(rooms.values())
    .filter((room) => !room.isPrivate)
    .map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      memberCount: room.members.length,
    }))

  return NextResponse.json({ rooms: publicRooms })
}

export async function POST(request: NextRequest) {
  const { name, description, userId } = await request.json()

  const roomId = crypto.randomUUID()
  const room: Room = {
    id: roomId,
    name,
    description,
    createdBy: userId,
    createdAt: Date.now(),
    members: [userId],
    isPrivate: false,
  }

  rooms.set(roomId, room)

  return NextResponse.json({ room })
}
