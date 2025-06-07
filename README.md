# DevTea ☕ - Developer Chat Platform

A comprehensive real-time chat application designed specifically for developers. Features include chatrooms, direct messaging, user profiles, Google authentication, and a modern dark UI optimized for developer workflows.

## 🚀 Features

### Core Functionality
- **Real-time Messaging**: Instant message delivery using WebSockets
- **Dual Chat Modes**: Public chatrooms and private direct messages
- **CRUD Operations**: Create, read, update, and delete messages
- **Typing Indicators**: See when users are typing with animated dots
- **Smart Timestamps**: Relative time display with auto-updates

### User Management
- **Google OAuth Integration**: Sign in with Google account
- **Manual Registration**: Create account with email and name
- **User Profiles**: Customizable display name and username
- **Unique User Codes**: 6-character codes for easy user discovery
- **User Search**: Find users by username, user code, or display name
- **Account Management**: Edit profile and delete account

### Chat Features
- **Public Chatrooms**: Join predefined developer-focused rooms
- **Direct Messaging**: Private 1-on-1 conversations
- **Message Editing**: Edit your own messages with inline editing
- **Message Deletion**: Remove your own messages
- **Room Management**: Join/leave rooms, view member counts
- **Connection Status**: Visual WebSocket connection indicators

### Developer Experience
- **Dark Mode UI**: Eye-friendly dark theme
- **Responsive Design**: Works on desktop and mobile
- **Developer-Focused**: Rooms for Frontend, Backend, and General discussion
- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **System Verification**: Built-in health checks and diagnostics

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend
- **Runtime**: Next.js Edge Runtime
- **Real-time**: Native WebSocket API
- **Authentication**: Custom auth with Google OAuth simulation
- **Storage**: In-memory (production ready for database integration)

### Development
- **Package Manager**: npm/yarn/pnpm
- **Build Tool**: Next.js built-in
- **Type Checking**: TypeScript
- **Linting**: ESLint (Next.js default)
