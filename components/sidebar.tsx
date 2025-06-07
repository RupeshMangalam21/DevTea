"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Hash,
  MessageCircle,
  Search,
  Plus,
  Settings,
  LogOut,
  Coffee,
  X,
  UserPlus,
  UserMinus,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "./auth-provider"

interface Room {
  id: string
  name: string
  description: string
  memberCount: number
  isMember: boolean
  isJoined: boolean
}

interface User {
  id: string
  username: string
  name: string
  userCode: string
  avatar?: string
}

interface SidebarProps {
  currentView: "rooms" | "dms"
  currentRoomId?: string
  currentDMUser?: string
  connected: boolean
  wsClient: any
  onViewChange: (view: "rooms" | "dms") => void
  onRoomSelect: (roomId: string) => void
  onDMSelect: (userId: string) => void
  onShowProfile: () => void
}

export function Sidebar({
  currentView,
  currentRoomId,
  currentDMUser,
  connected,
  wsClient,
  onViewChange,
  onRoomSelect,
  onDMSelect,
  onShowProfile,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [roomSearchQuery, setRoomSearchQuery] = useState("")
  const [roomSearchResults, setRoomSearchResults] = useState<Room[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showRoomSearch, setShowRoomSearch] = useState(false)
  const [newRoomData, setNewRoomData] = useState({ name: "", description: "" })
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [roomsLoaded, setRoomsLoaded] = useState(false)

  useEffect(() => {
    if (currentView === "rooms" && connected && !roomsLoaded) {
      fetchRooms()
      fetchJoinedRooms()
      setRoomsLoaded(true)
    }
  }, [currentView, connected, roomsLoaded])

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    if (roomSearchQuery.length > 1) {
      searchRooms()
    } else {
      setRoomSearchResults([])
    }
  }, [roomSearchQuery])

  useEffect(() => {
    // Fetch online users periodically
    const interval = setInterval(fetchOnlineUsers, 5000)
    fetchOnlineUsers()
    return () => clearInterval(interval)
  }, [connected])

  const fetchRooms = async () => {
    if (!wsClient) return
    try {
      await wsClient.getRooms()
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    }
  }

  const fetchJoinedRooms = async () => {
    if (!wsClient) return
    try {
      await wsClient.getJoinedRooms()
    } catch (error) {
      console.error("Failed to fetch joined rooms:", error)
    }
  }

  const fetchOnlineUsers = async () => {
    if (!wsClient) return
    try {
      await wsClient.getOnlineUsers()
    } catch (error) {
      console.error("Failed to fetch online users:", error)
    }
  }

  const searchUsers = async () => {
    try {
      const response = await fetch(`/api/auth/google?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error("Failed to search users:", error)
    }
  }

  const searchRooms = async () => {
    if (!wsClient) return
    try {
      await wsClient.searchRooms(roomSearchQuery)
    } catch (error) {
      console.error("Failed to search rooms:", error)
    }
  }

  const handleUserSelect = (selectedUser: User) => {
    onDMSelect(selectedUser.id)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomData.name.trim() || !wsClient) return

    try {
      console.log("Creating room:", newRoomData)
      const result = await wsClient.createRoom(newRoomData.name, newRoomData.description)
      console.log("Room creation result:", result)

      if (result.success && result.data?.id) {
        setShowCreateRoom(false)
        setNewRoomData({ name: "", description: "" })

        // Wait a bit for the room to be fully created
        setTimeout(async () => {
          console.log("Switching to new room:", result.data.id)
          await fetchRooms()
          await fetchJoinedRooms()
          onRoomSelect(result.data.id)
        }, 500)
      } else {
        console.error("Room creation failed:", result)
        alert(result.error || "Failed to create room")
      }
    } catch (error) {
      console.error("Failed to create room:", error)
      alert("Failed to create room")
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    if (!wsClient) return
    try {
      const result = await wsClient.joinRoom(roomId)
      if (result.success) {
        // Refresh both lists
        setTimeout(() => {
          fetchRooms()
          fetchJoinedRooms()
        }, 100)
        onRoomSelect(roomId)
        setShowRoomSearch(false)
        setRoomSearchQuery("")
      }
    } catch (error) {
      console.error("Failed to join room:", error)
    }
  }

  const handleLeaveRoom = async (roomId: string) => {
    if (!wsClient) return
    try {
      const result = await wsClient?.leaveRoom(roomId)
      if (result?.success) {
        // Refresh both lists
        setTimeout(() => {
          fetchRooms()
          fetchJoinedRooms()
        }, 100)
        // If leaving current room, switch to general if it's joined, otherwise first available room
        if (currentRoomId === roomId) {
          const remainingRooms = joinedRooms.filter((r) => r.id !== roomId)
          if (remainingRooms.length > 0) {
            onRoomSelect(remainingRooms[0].id)
          } else {
            // Join general as fallback
            handleJoinRoom("general")
          }
        }
      }
    } catch (error) {
      console.error("Failed to leave room:", error)
    }
  }

  // Listen for WebSocket responses
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
        case "rooms_list":
          setRooms(message.data.rooms)
          break
        case "joined_rooms":
          setJoinedRooms(message.data.rooms)
          break
        case "search_results":
          setRoomSearchResults(message.data.rooms)
          break
        case "online_users":
          setOnlineUsers(message.data.users)
          break
        case "room_created":
          // Refresh rooms when a new room is created
          fetchRooms()
          fetchJoinedRooms()
          break
        case "room_joined":
          // Refresh joined rooms when user joins a room
          fetchJoinedRooms()
          break
        case "room_left":
          // Refresh joined rooms when user leaves a room
          fetchJoinedRooms()
          break
      }
    }

    if (wsClient && wsClient.onMessage) {
      const originalOnMessage = wsClient.onMessage
      wsClient.onMessage = (message: any) => {
        originalOnMessage(message)
        handleWebSocketMessage(message)
      }
    }
  }, [wsClient])

  const handleRoomSelect = async (roomId: string) => {
    console.log(`🔄 SIDEBAR: Room selection clicked for: ${roomId}`)
    onRoomSelect(roomId)
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-8 mb-4">
          <Coffee className="h-6 w-6 text-orange-500" />
          <h1 className="text-xl font-bold text-white">DevTea</h1>
          <div className={`connection-indicator ${connected ? "" : "disconnected"}`}>
            <span className="text-xs text-gray-400">{connected ? "Connected" : "Connecting..."}</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={currentView === "rooms" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("rooms")}
            className="flex-1"
          >
            <Hash className="h-4 w-4 mr-2" />
            Rooms
          </Button>
          <Button
            variant={currentView === "dms" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("dms")}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            DMs
          </Button>
        </div>
      </div>

      {/* Search */}
      {currentView === "dms" && (
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* User Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="p-3 hover:bg-gray-600 cursor-pointer flex items-center space-x-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400">
                      @{user.username} • {user.userCode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Room Search */}
      {currentView === "rooms" && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex space-x-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rooms..."
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowRoomSearch(!showRoomSearch)}
              className={showRoomSearch ? "bg-gray-600" : ""}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Room Search Results */}
          {showRoomSearch && roomSearchResults.length > 0 && (
            <div className="mb-3 bg-gray-700 rounded-lg max-h-48 overflow-y-auto">
              <div className="p-2 border-b border-gray-600">
                <p className="text-xs text-gray-400 font-medium">Search Results</p>
              </div>
              {roomSearchResults.map((room) => (
                <div key={room.id} className="p-3 hover:bg-gray-600 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{room.name}</p>
                      <p className="text-xs text-gray-400 truncate">{room.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {room.memberCount} members
                        </Badge>
                        {room.isMember && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Joined
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {!room.isMember ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleJoinRoom(room.id)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRoomSelect(room.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Hash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentView === "rooms" ? (
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">My Rooms</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateRoom(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Create Room Modal */}
            {showCreateRoom && (
              <Card className="mb-4 bg-gray-700 border-gray-600">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-white">Create New Room</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreateRoom(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleCreateRoom} className="space-y-3">
                    <Input
                      placeholder="Room name"
                      value={newRoomData.name}
                      onChange={(e) => setNewRoomData((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newRoomData.description}
                      onChange={(e) => setNewRoomData((prev) => ({ ...prev, description: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Button type="submit" size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Room
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Joined Rooms */}
            {joinedRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentRoomId === room.id ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Hash className="h-4 w-4" />
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      console.log(`🎯 SIDEBAR: Room clicked: ${room.id}`)
                      onRoomSelect(room.id)
                    }}
                  >
                    <p className="font-medium truncate">{room.name}</p>
                    <p className="text-xs opacity-70 truncate">{room.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      {room.memberCount}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLeaveRoom(room.id)
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {joinedRooms.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rooms joined yet</p>
                <p className="text-xs">Search for rooms or create your own!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Direct Messages</h3>

            {/* Online Users */}
            {onlineUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Online ({onlineUsers.filter((u) => u.userId !== user?.id).length})
                </h4>
                {onlineUsers
                  .filter((u) => u.userId !== user?.id)
                  .map((onlineUser) => (
                    <div
                      key={onlineUser.userId}
                      onClick={() => onDMSelect(onlineUser.userId)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        currentDMUser === onlineUser.userId
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-700 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{onlineUser.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">@{onlineUser.username}</p>
                          {onlineUser.currentRoom && <p className="text-xs opacity-70">in #{onlineUser.currentRoom}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {conversations.map((conv) => (
              <div
                key={conv.recipientId}
                onClick={() => onDMSelect(conv.recipientId)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentDMUser === conv.recipientId ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">User {conv.recipientId}</p>
                    {conv.lastMessage && <p className="text-xs opacity-70 truncate">{conv.lastMessage.content}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{user?.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">
              @{user?.username} • {user?.userCode}
            </p>
          </div>
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={onShowProfile}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
