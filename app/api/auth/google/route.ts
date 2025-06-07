import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory user storage (use database in production)
const users = new Map<
  string,
  {
    id: string
    email: string
    name: string
    username: string
    avatar?: string
    userCode: string
    createdAt: number
  }
>()

export async function POST(request: NextRequest) {
  try {
    const { email, name, picture } = await request.json()

    // Generate unique username and user code
    const baseUsername = name.toLowerCase().replace(/\s+/g, "")
    let username = baseUsername
    let counter = 1

    // Ensure unique username
    while (Array.from(users.values()).some((user) => user.username === username)) {
      username = `${baseUsername}${counter}`
      counter++
    }

    const userCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const userId = crypto.randomUUID()

    const user = {
      id: userId,
      email,
      name,
      username,
      avatar: picture,
      userCode,
      createdAt: Date.now(),
    }

    users.set(userId, user)

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("search")

  if (!query) {
    return NextResponse.json({ users: [] })
  }

  const searchResults = Array.from(users.values())
    .filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.userCode.toLowerCase().includes(query.toLowerCase()) ||
        user.name.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 10) // Limit results
    .map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      userCode: user.userCode,
      avatar: user.avatar,
    }))

  return NextResponse.json({ users: searchResults })
}

export async function DELETE(request: NextRequest) {
  const { userId } = await request.json()

  if (users.has(userId)) {
    users.delete(userId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "User not found" }, { status: 404 })
}
