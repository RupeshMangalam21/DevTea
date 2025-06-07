"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  username: string
  userCode: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: any) => void
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem("devtea-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = (userData: any) => {
    setUser(userData)
    localStorage.setItem("devtea-user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("devtea-user")
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("devtea-user", JSON.stringify(updatedUser))
    }
  }

  const deleteAccount = async () => {
    if (user) {
      try {
        await fetch("/api/auth/google", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })
        logout()
      } catch (error) {
        console.error("Failed to delete account:", error)
        throw error
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
