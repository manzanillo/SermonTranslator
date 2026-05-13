# Server Consolidation Notes

## Overview
The `server.js` and `translations-api.js` files have been consolidated into a single `server.js` file to reduce code duplication and improve maintainability.

## What Changed

### Previous Architecture
- **server.js**: Handled Socket.IO connections on port 3000
- **translations-api.js**: Handled Express REST API on port 3001

### New Architecture
- **server.js**: Unified server with both Socket.IO and Express API on port 3001

## Features Consolidated

### Socket.IO Features (from original server.js)
- Real-time client connection tracking
- Session status broadcasting
- Speech-to-translation real-time handling
- Live listener count updates

### REST API Features (from original translations-api.js)
- User authentication (register, login, logout)
- User management endpoints
- Session management endpoints
- Translation CRUD operations
- JWT token validation
- Rate limiting for login and registration
- Prisma database integration

## Port Configuration
- **Previous**: Socket.IO on port 3000, REST API on port 3001
- **Current**: All services on port 3001 (configurable via `PORT` environment variable, defaults to 3001)

## Usage
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm start
```

## Available Endpoints

### Status
- `GET /status` - Server and session status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session by ID

### Translations
- `GET /api/translations` - Get all translations
- `GET /api/translations/:id` - Get translation by ID
- `POST /api/translations` - Create translation
- `PUT /api/translations/:id` - Update translation
- `DELETE /api/translations/:id` - Delete translation

### Socket.IO Events
- `connection` - New client connection
- `disconnect` - Client disconnection
- `listenerCount` - Broadcast listener count
- `sessionStatus` - Broadcast session status
- `speech` - Handle speech input
- `startSession` - Start broadcast session
- `endSession` - End broadcast session
- `translation` - Broadcast translation results

## Benefits
1. **Reduced Code Duplication**: Eliminated duplicate middleware and configuration
2. **Unified Port**: Single port for all backend services
3. **Better Maintainability**: Easier to manage dependencies and updates
4. **Shared Resources**: Socket.IO and Express can share Prisma client, middleware, etc.
5. **Simplified Development**: Single server to start and debug

## Migration Notes
- All existing functionality remains intact
- No breaking changes to API endpoints
- No breaking changes to Socket.IO events
- Update any client configurations pointing to port 3000 to use port 3001

## Dependencies
All dependencies from both files are already included in `package.json`:
- express, socket.io, cors, bcrypt, jsonwebtoken, cookie-parser
- express-rate-limit, axios, @prisma/client
- Development: nodemon
