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

## 📋 Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Modern browser with WebSocket support
- (Optional) Google OAuth credentials for production
- (Optional) Redis instance for production scaling

## 🔧 Installation & Setup

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd devtea-chat
npm install
\`\`\`

### 2. Environment Configuration

#### Quick Start (Development)

For immediate testing, copy the example environment file:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

This includes mock values that work out of the box for development.

#### Production Setup

1. **Copy the environment template:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Configure each service** (see detailed instructions below)

3. **Update the values** in \`.env.local\`

### 3. Required Environment Variables

#### Essential Variables (Required)

\`\`\`env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Security
JWT_SECRET=your_64_character_random_string

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
\`\`\`

#### Optional Variables (Recommended for Production)

\`\`\`env
# Redis for scaling (optional but recommended)
REDIS_URL=rediss://default:password@host:port

# Error tracking
SENTRY_DSN=https://key@org.ingest.sentry.io/project

# NextAuth.js (if using)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
\`\`\`

### 4. Obtaining API Keys

#### Google OAuth Credentials

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project**
3. **Enable Google+ API or People API**
4. **Create OAuth 2.0 credentials:**
   - Application type: Web application
   - Authorized origins: \`http://localhost:3000\`, \`https://your-domain.com\`
   - Authorized redirect URIs: \`http://localhost:3000/api/auth/callback/google\`
5. **Copy Client ID and Client Secret**

#### Redis URL (Optional)

**Option A: Upstash (Recommended)**
1. Go to [Upstash](https://upstash.com/)
2. Create free account
3. Create new Redis database
4. Copy the connection URL

**Option B: Redis Cloud**
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create free account
3. Create new database
4. Get connection details

#### JWT Secret

Generate a secure random string:

\`\`\`bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
\`\`\`

#### Sentry DSN (Optional)

1. Go to [Sentry.io](https://sentry.io/)
2. Create free account
3. Create new Next.js project
4. Copy the DSN from project settings

### 5. Development Server

\`\`\`bash
npm run dev
\`\`\`

### 6. Verify Installation

Visit \`http://localhost:3000/verify\` to run comprehensive system checks, or click "System Verification" on the login page.

## 🧪 Testing & Verification

### Built-in Verification System

DevTea includes a comprehensive verification system:

1. **Access verification panel**: \`http://localhost:3000/verify\`
2. **Automatic checks include:**
   - Environment variables validation
   - API endpoints testing
   - WebSocket connectivity
   - Authentication flow
   - Memory usage monitoring
   - Response time analysis

### Manual Testing Checklist

#### Authentication
- [ ] Google OAuth login works
- [ ] Manual registration works
- [ ] User profile displays correctly
- [ ] Profile editing saves changes
- [ ] Account deletion works
- [ ] Logout clears session

#### Chatrooms
- [ ] Can view available rooms
- [ ] Can join different rooms
- [ ] Messages sync in real-time
- [ ] Room member count updates
- [ ] Can leave rooms

#### Direct Messages
- [ ] User search finds users
- [ ] Can start DM conversations
- [ ] DM messages are private
- [ ] DM history persists

#### Messaging
- [ ] Messages send instantly
- [ ] Can edit own messages
- [ ] Can delete own messages
- [ ] Typing indicators work
- [ ] Timestamps display correctly

#### Real-time Features
- [ ] Multiple users see same messages
- [ ] Typing indicators sync
- [ ] Connection status accurate
- [ ] Reconnection after network issues

### API Testing

Test individual endpoints:

\`\`\`bash
# Health check
curl http://localhost:3000/api/health

# Rooms API
curl http://localhost:3000/api/rooms

# User search
curl "http://localhost:3000/api/auth/google?search=test"
\`\`\`

### WebSocket Testing

Use the built-in test script or wscat:

\`\`\`bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000/api/websocket

# Send test messages
{"type":"register","data":{"userId":"test-user","username":"testuser"}}
{"type":"join_room","data":{"roomId":"general"}}
{"type":"send_message","data":{"username":"testuser","content":"Hello World","type":"room","roomId":"general"}}
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy to Vercel:**
   - Connect GitHub repository to Vercel
   - Vercel auto-detects Next.js configuration
   - WebSockets work out of the box

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables from your \`.env.local\`
   - Update \`ALLOWED_ORIGINS\` to include your Vercel domain
   - Update \`NEXTAUTH_URL\` to your production URL

4. **Update Google OAuth:**
   - Add your Vercel domain to Google Cloud Console
   - Update authorized origins and redirect URIs

### Environment Variables for Production

\`\`\`env
# Update these for production
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_secret
ALLOWED_ORIGINS=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
JWT_SECRET=different_production_secret
REDIS_URL=your_production_redis_url
SENTRY_DSN=your_production_sentry_dsn
NODE_ENV=production
\`\`\`

### Alternative Deployment Platforms

#### Railway
\`\`\`bash
npm install -g @railway/cli
railway login
railway init
railway up
\`\`\`

#### Render
1. Connect GitHub repository
2. Set build command: \`npm run build\`
3. Set start command: \`npm start\`
4. Add environment variables

#### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🔒 Security Configuration

### Environment Security

- **Never commit \`.env.local\` to version control**
- **Use different secrets for each environment**
- **Rotate secrets regularly**
- **Use strong, random JWT secrets**

### Production Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] Error tracking configured
- [ ] Security headers set

## 📈 Performance Optimization

### Current Limitations
- In-memory storage (not scalable beyond single instance)
- No message pagination
- No connection pooling
- Single server instance

### Production Optimizations

1. **Add Redis for scaling:**
   \`\`\`env
   REDIS_URL=your_redis_connection_string
   \`\`\`

2. **Database integration:**
   \`\`\`env
   DATABASE_URL=postgresql://user:pass@host:port/db
   \`\`\`

3. **Enable caching and compression**

4. **Implement rate limiting**

## 🐛 Troubleshooting

### Common Issues

#### Environment Variables Not Loading
\`\`\`bash
# Check if .env.local exists
ls -la .env.local

# Verify file format (no spaces around =)
cat .env.local

# Restart development server
npm run dev
\`\`\`

#### WebSocket Connection Failed
\`\`\`bash
# Check if port 3000 is available
lsof -i :3000

# Check firewall settings
# Verify browser WebSocket support
\`\`\`

#### Google OAuth Not Working
- Verify client ID and secret
- Check authorized domains in Google Console
- Ensure redirect URIs match exactly
- Check browser console for errors

#### Redis Connection Issues
- Verify Redis URL format
- Check network connectivity
- Ensure Redis instance is running
- Test connection with Redis CLI

### Debug Mode

Enable detailed logging:

\`\`\`bash
# Development
DEBUG=true npm run dev

# Check logs
tail -f .next/trace
\`\`\`

### Getting Help

1. **Check the verification panel**: \`/verify\`
2. **Review console logs** in browser dev tools
3. **Check server logs** in terminal
4. **Test individual components** using the verification system
5. **Create GitHub issue** with detailed error information

## 📝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: \`git checkout -b feature/amazing-feature\`
3. Set up environment variables
4. Run verification tests
5. Make changes and test thoroughly
6. Commit changes: \`git commit -m 'Add amazing feature'\`
7. Push to branch: \`git push origin feature/amazing-feature\`
8. Open Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Ensure responsive design
- Test on multiple browsers
- Run verification tests before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Vercel** for seamless deployment and WebSocket support
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for utility-first styling
- **Developer Community** for inspiration and feedback

---

**Built with ❤️ for the developer community**

*DevTea ☕ - Where developers connect, collaborate, and caffeinate*

## 📞 Support

### Quick Start Issues

If you're having trouble getting started:

1. **Use the quick start option:**
   \`\`\`bash
   cp .env.local.example .env.local
   npm run dev
   \`\`\`

2. **Visit the verification page:** \`http://localhost:3000/verify\`

3. **Check the console** for any error messages

4. **Review this README** for detailed setup instructions

### Getting API Keys

Need help obtaining API keys? See the detailed guides in the [Technical Documentation](TECHNICAL_DOCS.md) or follow the step-by-step instructions in the Environment Configuration section above.

### Production Deployment

For production deployment help:

1. Follow the Vercel deployment guide above
2. Ensure all environment variables are set
3. Test with the verification system
4. Monitor logs for any issues

**Remember**: The app works out of the box with the example environment file for development and testing!
\`\`\`

Now let's create a setup script to make it even easier:
