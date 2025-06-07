"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Trash2, Send, Check, X, Hash, MessageCircle, Users, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { GoogleAuth } from "@/components/google-auth"
import { Sidebar } from "@/components/sidebar"
import { ProfileModal } from "@/components/profile-modal"
import { formatRelativeTime, formatMessageTime } from "@/lib/date-utils"
import { DevTeaWebSocketClient } from "@/lib/websocket-client"

interface Message {
  id: string
  user: string
  content: string
  timestamp: number
  edited?: boolean
  type: "room" | "dm"
  roomId?: string
  recipientId?: string
}

export default function DevTeaApp() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [connected, setConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">(
    "connecting",
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<"rooms" | "dms">("rooms")
  const [currentRoomId, setCurrentRoomId] = useState<string>("general")
  const [currentDMUser, setCurrentDMUser] = useState<string>()
  const [showProfile, setShowProfile] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [initialLoad, setInitialLoad] = useState(true)
  const [userJoinedRooms, setUserJoinedRooms] = useState<string[]>([])

  const wsClientRef = useRef<DevTeaWebSocketClient | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) return

    // Initialize WebSocket client
    const wsClient = new DevTeaWebSocketClient(user.id, user.username, handleWebSocketMessage)

    wsClientRef.current = wsClient
    setConnectionStatus("connecting")
    wsClient.connect()

    return () => {
      wsClient.disconnect()
    }
  }, [user])

  useEffect(() => {
    // Load messages when room/DM changes (but don't auto-join)
    if (wsClientRef.current && connected && !initialLoad) {
      if (currentView === "rooms") {
        wsClientRef.current.getMessages("room", currentRoomId)
      } else if (currentDMUser) {
        wsClientRef.current.getMessages("dm", undefined, currentDMUser)
      }
    }
  }, [currentView, currentRoomId, currentDMUser, connected, initialLoad])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > lastMessageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setLastMessageCount(messages.length)
    }
  }, [messages, lastMessageCount])

  const currentRoomIdRef = useRef(currentRoomId)
  useEffect(() => {
    currentRoomIdRef.current = currentRoomId
  }, [currentRoomId])

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case "connected":
        setConnected(true)
        setConnectionStatus("connected")

        if (message.data?.joinedRooms) {
          setUserJoinedRooms(message.data.joinedRooms)

          if (message.data.joinedRooms.length > 0 && initialLoad) {
            const lastRoom = message.data.joinedRooms[message.data.joinedRooms.length - 1]
            setCurrentRoomId(lastRoom)
            wsClientRef.current?.joinRoom(lastRoom)
          } else if (initialLoad) {
            wsClientRef.current?.joinRoom("general")
          }
          setInitialLoad(false)
        }
        break

      case "disconnected":
        setConnected(false)
        setConnectionStatus("disconnected")
        break

      case "connection_lost":
      case "connection_failed":
        setConnected(false)
        setConnectionStatus("error")
        break

      case "room_joined":
        if (currentView === "rooms" && message.data.roomId === currentRoomIdRef.current) {
          const roomMessages = message.data.messages || []
          setMessages([...roomMessages])
        }
        break

      case "room_messages":
        if (currentView === "rooms" && message.data.roomId === currentRoomIdRef.current) {
          const roomMessages = message.data.messages || []
          setMessages(() => [...roomMessages])
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }, 100)
        }
        break

      case "room_messages_update":
        if (currentView === "rooms" && message.data.roomId === currentRoomIdRef.current) {
          const newMessages = message.data.messages || []
          setMessages(() => [...newMessages])
        }
        break

      case "dm_messages":
        if (currentView === "dms" && message.data.recipientId === currentDMUser) {
          setMessages(message.data.messages || [])
        }
        break

      case "dm_messages_update":
        if (currentView === "dms" && message.data.recipientId === currentDMUser) {
          const newMessages = message.data.messages || []
          setMessages((prevMessages) => {
            if (JSON.stringify(newMessages) !== JSON.stringify(prevMessages)) {
              return newMessages
            }
            return prevMessages
          })
        }
        break

      case "message_sent":
        const newMsg = message.data
        if (
          (currentView === "rooms" && newMsg.type === "room" && newMsg.roomId === currentRoomIdRef.current) ||
          (currentView === "dms" && newMsg.type === "dm" && (newMsg.recipientId === currentDMUser || newMsg.user === user?.username))
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev
            }
            return [...prev, newMsg]
          })
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }, 100)
        }
        break

      case "message_edited":
        setMessages((prev) => prev.map((msg) => (msg.id === message.data.id ? message.data : msg)))
        break

      case "message_deleted":
        setMessages((prev) => prev.filter((msg) => msg.id !== message.data.messageId))
        break

      case "room_created":
        if (message.data?.id) {
          setCurrentRoomId(message.data.id)
          setCurrentView("rooms")
        }
        break
    }
  }

  if (!user) {
    return <GoogleAuth />
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !connected || !wsClientRef.current) return

    const result = await wsClientRef.current.sendChatMessage(
      input.trim(),
      currentView === "rooms" ? "room" : "dm",
      currentView === "rooms" ? currentRoomId : undefined,
      currentView === "dms" ? currentDMUser : undefined,
    )

    if (result.success) {
      setInput("")
    } else {
      alert("Failed to send message: " + result.error)
    }
  }

  const handleRoomSelect = async (roomId: string) => {
    setCurrentRoomId(roomId)
    setCurrentView("rooms")

    if (wsClientRef.current && connected) {
      try {
        const joinResult = await wsClientRef.current.joinRoom(roomId)

        if (!joinResult.success) {
          return
        }

        const messagesResult = await wsClientRef.current.getMessages("room", roomId)
      } catch (error: any) {
        console.error("Error in room selection:", error)
      }
    }
  }

  const handleDMSelect = async (userId: string) => {
    setCurrentDMUser(userId)
    setCurrentView("dms")
    setMessages([]) // Clear messages immediately

    if (wsClientRef.current && connected) {
      const result = await wsClientRef.current.getMessages("dm", undefined, userId)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!wsClientRef.current) return

    const result = await wsClientRef.current.editMessage(
      messageId,
      newContent,
      currentView === "rooms" ? currentRoomId : undefined,
      currentView === "dms" ? currentDMUser : undefined,
    )

    if (result.success) {
      setEditingId(null)
      setEditText("")
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!wsClientRef.current) return

    const result = await wsClientRef.current.deleteMessage(
      messageId,
      currentView === "rooms" ? currentRoomId : undefined,
      currentView === "dms" ? currentDMUser : undefined,
    )
  }

  const handleReconnect = async () => {
    if (wsClientRef.current) {
      setConnectionStatus("connecting")
      await wsClientRef.current.reconnect()
    }
  }

  const startEdit = (message: Message) => {
    setEditingId(message.id)
    setEditText(message.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      handleEditMessage(editingId, editText.trim())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing indicator after 3 seconds
    }, 3000)
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "connecting":
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case "error":
        return <WifiOff className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "disconnected":
        return "Disconnected"
      case "error":
        return "Connection Error"
      default:
        return "Unknown"
    }
  }

  const renderHeader = () => {
    const roomNames = {
      general: "General",
      frontend: "Frontend Devs",
      backend: "Backend Devs",
      tea: "Tea",
    }

    if (currentView === "rooms") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {roomNames[currentRoomId as keyof typeof roomNames] || currentRoomId}
              </h2>
              <p className="text-sm text-gray-400 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{messages.length} messages</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (wsClientRef.current && connected) {
                  setMessages([])
                  await wsClientRef.current.getMessages("room", currentRoomId)
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {getConnectionIcon()}
            <span className="text-sm text-gray-400">{getConnectionText()}</span>
            {connectionStatus === "error" && (
              <Button size="sm" variant="outline" onClick={handleReconnect}>
                Reconnect
              </Button>
            )}
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {currentDMUser ? `Direct Message` : "Select a conversation"}
              </h2>
              <p className="text-sm text-gray-400 flex items-center space-x-2">
                <span>{messages.length} messages</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-400">{getConnectionText()}</span>
            {connectionStatus === "error" && (
              <Button size="sm" variant="outline" onClick={handleReconnect}>
                Reconnect
              </Button>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        currentView={currentView}
        currentRoomId={currentRoomId}
        currentDMUser={currentDMUser}
        connected={connected}
        wsClient={wsClientRef.current}
        onViewChange={setCurrentView}
        onRoomSelect={handleRoomSelect}
        onDMSelect={handleDMSelect}
        onShowProfile={() => setShowProfile(true)}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">{renderHeader()}</div>

        {/* Connection Status Banner */}
        {connectionStatus !== "connected" && (
          <div
            className={`px-4 py-2 text-sm text-center ${
              connectionStatus === "error"
                ? "bg-red-900 text-red-200"
                : connectionStatus === "connecting"
                  ? "bg-yellow-900 text-yellow-200"
                  : "bg-gray-700 text-gray-300"
            }`}
          >
            {connectionStatus === "error" && "⚠️ Connection lost. Some features may not work. "}
            {connectionStatus === "connecting" && "🔄 Connecting to server... "}
            {connectionStatus === "disconnected" && "📡 Disconnected from server. "}
            {connectionStatus === "error" && (
              <Button size="sm" variant="link" onClick={handleReconnect} className="text-red-200 underline p-0 h-auto">
                Try reconnecting
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 messages-container">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">
                  {currentView === "rooms"
                    ? "Start the conversation in this room!"
                    : "Send a direct message to get started!"}
                </p>
                {connectionStatus !== "connected" && (
                  <p className="text-xs text-red-400 mt-2">Check your internet connection to send messages</p>
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex message-bubble ${message.user === user.username ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg group ${
                    message.user === user.username ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                  }`}
                >
                  {editingId === message.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit()
                          if (e.key === "Escape") cancelEdit()
                        }}
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={saveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {message.user !== user.username && (
                        <div className="text-xs font-medium text-blue-400 mb-1">@{message.user}</div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs opacity-70">
                          <span title={formatMessageTime(message.timestamp)}>
                            {formatRelativeTime(message.timestamp)}
                          </span>
                          {message.edited && " (edited)"}
                        </div>

                        {message.user === user.username && (
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => startEdit(message)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-2 text-sm text-gray-400 italic">
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
          </div>
        )}

        {/* Input */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={
                connectionStatus !== "connected"
                  ? "Check your connection to send messages..."
                  : currentView === "rooms"
                    ? `Message #${currentRoomId}...`
                    : currentDMUser
                      ? "Type a message..."
                      : "Select a conversation to start messaging..."
              }
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              disabled={connectionStatus !== "connected" || (currentView === "dms" && !currentDMUser)}
            />
            <Button
              type="submit"
              disabled={!input.trim() || connectionStatus !== "connected" || (currentView === "dms" && !currentDMUser)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  )
}