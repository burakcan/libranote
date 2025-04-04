# API Architecture for LibraNote

## Overview

The API server is built using Express.js and provides authentication, data access, and real-time updates for the LibraNote application. This document outlines the architecture, endpoints, and key components.

## Core Components

### Authentication

- Uses Better Auth for authentication and session management
- Implements middleware to protect routes
- Session validation is centralized to avoid repetition

### Data Access Layer

- Prisma ORM for database interactions
- Organized by entity type (collections, notes)
- Permission-based access control built into data operations

### Server-Sent Events (SSE)

- Real-time updates for collaborative editing
- Client filtering to prevent echo effects
- Event types for all CRUD operations

## API Structure

### Middleware

- Authentication middleware for protected routes
- Error handling middleware
- Permission validation middleware

### Routes

- Collection routes (`/api/collections`)
- Note routes (`/api/notes`)
- SSE endpoint (`/api/sse`)

### Controllers

- Collection controller
- Note controller
- SSE controller

## Permission Model

### Collections

- **List/Read**: User owns collection OR is a member
- **Create**: Authenticated users can create collections
- **Update**: User owns collection OR is a member with `canEdit` permission
- **Delete**: Only collection owners can delete collections

### Notes

- **List/Read**: User owns note OR is a collaborator OR is a member of the parent collection
- **Create**: User owns parent collection OR is a member of the parent collection
- **Update**: User owns note OR is a collaborator with `canEdit` permission OR is a member of the parent collection with `canEdit` permission
- **Delete**: User owns note OR user owns parent collection OR user is a member of parent collection (but not merely a collaborator)

## Event System

The SSE system provides real-time updates for:

- Collection creation/update/deletion
- Note creation/update/deletion

Events are filtered by client ID to prevent echo effects (clients don't receive their own events).

## Error Handling

- Standardized error responses
- HTTP status codes aligned with error types
- Detailed error information for developers

## Security Considerations

- All routes are authenticated
- Permission checks before data operations
- CORS configuration to restrict access
