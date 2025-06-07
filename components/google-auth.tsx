"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "./auth-provider"

interface MockAccount {
  id: string
  email: string
  name: string
  picture: string
}

const mockAccounts: MockAccount[] = [
  {
    id: "1",
    email: "alice.developer@gmail.com",
    name: "Alice Johnson",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: "2",
    email: "bob.coder@gmail.com",
    name: "Bob Smith",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "3",
    email: "charlie.dev@gmail.com",
    name: "Charlie Brown",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
  {
    id: "4",
    email: "diana.frontend@gmail.com",
    name: "Diana Prince",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
  },
  {
    id: "5",
    email: "evan.backend@gmail.com",
    name: "Evan Davis",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Evan",
  },
]

export function GoogleAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [showAccountPicker, setShowAccountPicker] = useState(false)
  const [showManualAuth, setShowManualAuth] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const { login } = useAuth()

  const handleGoogleAuth = () => {
    setShowAccountPicker(true)
  }

  const handleAccountSelect = async (account: MockAccount) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          name: account.name,
          picture: account.picture,
        }),
      })

      const data = await response.json()
      if (data.user) {
        login(data.user)
      }
    } catch (error) {
      console.error("Auth failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const mockData = {
        email: formData.email,
        name: formData.name,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
      }

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
      })

      const data = await response.json()
      if (data.user) {
        login(data.user)
      }
    } catch (error) {
      console.error("Auth failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showAccountPicker) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Choose an account</CardTitle>
            <p className="text-gray-400">Select which account to use for DevTea</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => handleAccountSelect(account)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account.picture || "/placeholder.svg"} />
                  <AvatarFallback>{account.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{account.name}</p>
                  <p className="text-xs text-gray-400 truncate">{account.email}</p>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-600">
              <Button
                onClick={() => setShowManualAuth(true)}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Use another account
              </Button>
              <Button
                onClick={() => setShowAccountPicker(false)}
                variant="ghost"
                className="w-full mt-2 text-gray-400 hover:text-gray-300"
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Welcome to DevTea ☕</CardTitle>
          <p className="text-gray-400">Chat platform for developers</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showManualAuth ? (
            <>
              <Button onClick={handleGoogleAuth} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Signing in..." : "Continue with Google"}
              </Button>
              <Button
                onClick={() => setShowManualAuth(true)}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Sign in manually
              </Button>
              <Button
                onClick={() => window.open("/verify", "_blank")}
                variant="outline"
                className="w-full border-orange-600 text-orange-300 hover:bg-orange-700"
              >
                🔧 System Verification
              </Button>

              <div className="text-center text-xs text-gray-500 mt-4">
                <p>💡 Demo Mode: Choose from pre-made accounts or create your own</p>
                <p>Multiple users can be logged in simultaneously for testing</p>
              </div>
            </>
          ) : (
            <form onSubmit={handleManualAuth} className="space-y-4">
              <Input
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
              <Input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <Button
                type="button"
                onClick={() => setShowManualAuth(false)}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
