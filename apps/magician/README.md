# Magician - Hocuspocus Collaboration Server

Magician is a refactored and maintainable Hocuspocus WebSocket server that handles real-time collaborative editing for the Libranote application.

## 🏗️ Architecture

The service has been completely refactored from a single monolithic file into a well-structured, maintainable codebase:

```
src/
├── index.ts              # Main entry point with graceful shutdown
├── server.ts             # Hocuspocus server configuration
├── env.ts                # Environment configuration with validation
├── global.d.ts           # Global TypeScript declarations
├── db/
│   └── prisma.ts         # Database client export
├── hooks/
│   ├── authentication.ts # Authentication hooks
│   └── document.ts       # Document lifecycle hooks
├── services/
│   ├── auth-service.ts   # Authorization and permission checks
│   ├── document-service.ts # Y.js document operations
│   └── jwt-service.ts    # JWT token verification
├── types/
│   └── index.ts          # TypeScript interfaces and types
└── utils/
    └── logger.ts         # Structured logging utility
```

## 🚀 Features

- **JWT Authentication**: Secure token-based authentication with JWKS support
- **Permission-based Access**: Role-based access control for notes and collections
- **Document Persistence**: Automatic saving and loading of Y.js documents
- **Real-time Webhooks**: SSE webhook notifications for document updates
- **Graceful Shutdown**: Proper cleanup on server termination
- **Structured Logging**: Categorized logging with environment-based levels
- **TypeScript**: Full type safety with strict configuration
- **Error Handling**: Comprehensive error handling and recovery

## 🔧 Environment Variables

Required environment variables:

```bash
PORT=3001                                    # Server port (default: 3001)
JWKS_URL=https://your-auth-server/.well-known/jwks.json  # JWT verification endpoint
SSE_WEBHOOK_URL=http://your-api/webhook/sse  # SSE notification webhook
NODE_ENV=development                         # Environment (development/production)
```

## 📝 Scripts

```bash
# Development with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm check-types

# Linting and formatting
pnpm lint
pnpm format
```

## 🔒 Authentication Flow

1. Client connects with JWT token via HocuspocusProvider
2. Server verifies token against JWKS endpoint
3. Server checks user permissions for the requested note
4. Connection established with user context stored
5. Document operations restricted to authorized users

## 📊 Document Management

- **Loading**: Documents are loaded from database on connection
- **Saving**: Documents are automatically saved when modified
- **Webhooks**: SSE notifications sent on document updates
- **Keep-alive**: Special handling for keep-alive connections

## 🎯 Key Improvements

### From the Original Code:

- ✅ **Modular Architecture**: Separated concerns into services and hooks
- ✅ **Type Safety**: Full TypeScript with strict configuration
- ✅ **Error Handling**: Proper error boundaries and recovery
- ✅ **Environment Validation**: Startup-time configuration validation
- ✅ **Structured Logging**: Categorized logging with levels
- ✅ **Code Organization**: Clear separation of authentication, documents, and utilities
- ✅ **Development Experience**: Better dev tools with tsx and proper TypeScript setup

### Developer Experience:

- 🔧 Hot reload with tsx instead of node --watch
- 🎨 Proper ESLint configuration for server applications
- 📋 Type checking and linting in CI/CD pipeline
- 📝 Comprehensive error messages and logging
- 🔍 Better debugging with source maps and structured logs

## 🚀 Getting Started

1. **Set up environment variables** in `.env` file
2. **Install dependencies**: `pnpm install`
3. **Start development server**: `pnpm dev`
4. **Server will be available** on the configured port (default: 3001)

## 🔌 Integration

The magician service integrates with:

- **Authentication Service**: Via JWKS for JWT verification
- **Database**: Via Prisma for document and permission storage
- **API Service**: Via SSE webhooks for real-time notifications
- **Client Applications**: Via Hocuspocus WebSocket protocol

## 🛠️ Development

The codebase follows modern TypeScript practices:

- Strict type checking enabled
- Path mapping for clean imports (`@/`)
- ESM modules with proper extension handling
- Consistent code formatting with Prettier
- Comprehensive linting with ESLint

## 📚 Dependencies

- **@hocuspocus/server**: WebSocket collaboration server
- **jose**: JWT verification and JWKS support
- **yjs**: Conflict-free replicated data types
- **@repo/db**: Shared database client and types
- **tsx**: TypeScript execution for development
