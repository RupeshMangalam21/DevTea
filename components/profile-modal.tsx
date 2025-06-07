"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Save, X } from "lucide-react"
import { useAuth } from "./auth-provider"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile, deleteAccount } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
  })

  if (!isOpen || !user) return null

  const handleSave = () => {
    updateProfile(formData)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setIsDeleting(true)
      try {
        await deleteAccount()
      } catch (error) {
        console.error("Failed to delete account:", error)
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Profile Settings</CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{user.name[0]}</AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="text-xs">
              {user.userCode}
            </Badge>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Display Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white mt-1">{user.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              {isEditing ? (
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              ) : (
                <p className="text-white mt-1">@{user.username}</p>
              )}
            </div>

            <div>
              <Label className="text-gray-300">Email</Label>
              <p className="text-gray-400 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            {isEditing ? (
              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                Edit Profile
              </Button>
            )}

            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
