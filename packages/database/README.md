# Database Schema Documentation

This document provides a technical overview of the database schema used in the application, detailing each model, its fields, and the relationships between models. This schema is defined using Prisma, an ORM for Node.js and TypeScript.

## Models

### User

- **Fields:**
  - `id`: Unique identifier for each user.
  - `name`: The name of the user.
  - `email`: Unique email address for the user.
  - `emailVerified`: Boolean indicating if the user's email is verified.
  - `image`: Optional profile image URL.
  - `createdAt`: Timestamp of when the user was created.
  - `updatedAt`: Timestamp of the last update to the user.
- **Relationships:**
  - `accounts`: Links to the `Account` model, representing user accounts.
  - `invitations`: Links to the `Invitation` model, representing invitations sent by the user.
  - `members`: Links to the `Member` model, representing organizational memberships.
  - `createdNotes`: Links to the `Note` model, representing notes created by the user.
  - `ownedNotes`: Links to the `Note` model, representing notes owned by the user.
  - `noteCollaborators`: Links to the `NoteCollaborator` model, representing notes the user collaborates on.
  - `sessions`: Links to the `Session` model, representing user sessions.

### Session

- **Fields:**
  - `id`: Unique identifier for each session.
  - `expiresAt`: Expiration timestamp for the session.
  - `token`: Unique session token.
  - `createdAt`: Timestamp of when the session was created.
  - `updatedAt`: Timestamp of the last update to the session.
  - `ipAddress`: Optional IP address of the session.
  - `userAgent`: Optional user agent string of the session.
  - `userId`: Foreign key linking to the `User` model.
- **Relationships:**
  - `user`: Links to the `User` model, representing the user associated with the session.

### Account

- **Fields:**
  - `id`: Unique identifier for each account.
  - `accountId`: Identifier for the account.
  - `providerId`: Identifier for the account provider.
  - `userId`: Foreign key linking to the `User` model.
  - `accessToken`: Optional access token for the account.
  - `refreshToken`: Optional refresh token for the account.
  - `idToken`: Optional ID token for the account.
  - `accessTokenExpiresAt`: Optional expiration timestamp for the access token.
  - `refreshTokenExpiresAt`: Optional expiration timestamp for the refresh token.
  - `scope`: Optional scope of the account.
  - `password`: Optional password for the account.
  - `createdAt`: Timestamp of when the account was created.
  - `updatedAt`: Timestamp of the last update to the account.
- **Relationships:**
  - `user`: Links to the `User` model, representing the user associated with the account.

### Verification

- **Fields:**
  - `id`: Unique identifier for each verification.
  - `identifier`: Identifier for the verification.
  - `value`: Value of the verification.
  - `expiresAt`: Expiration timestamp for the verification.
  - `createdAt`: Optional timestamp of when the verification was created.
  - `updatedAt`: Optional timestamp of the last update to the verification.

### Organization

- **Fields:**
  - `id`: Unique identifier for each organization.
  - `name`: Name of the organization.
  - `slug`: Unique slug for the organization.
  - `logo`: Optional logo URL for the organization.
  - `createdAt`: Timestamp of when the organization was created.
  - `metadata`: Optional metadata for the organization.
- **Relationships:**
  - `invitations`: Links to the `Invitation` model, representing invitations sent by the organization.
  - `members`: Links to the `Member` model, representing members of the organization.
  - `notes`: Links to the `Note` model, representing notes associated with the organization.

### Member

- **Fields:**
  - `id`: Unique identifier for each member.
  - `organizationId`: Foreign key linking to the `Organization` model.
  - `userId`: Foreign key linking to the `User` model.
  - `role`: Role of the member within the organization.
  - `createdAt`: Timestamp of when the member was created.
- **Relationships:**
  - `organization`: Links to the `Organization` model, representing the organization the member belongs to.
  - `user`: Links to the `User` model, representing the user who is a member.

### Invitation

- **Fields:**
  - `id`: Unique identifier for each invitation.
  - `organizationId`: Foreign key linking to the `Organization` model.
  - `email`: Email address of the invitee.
  - `role`: Optional role for the invitee.
  - `status`: Status of the invitation.
  - `expiresAt`: Expiration timestamp for the invitation.
  - `inviterId`: Foreign key linking to the `User` model.
- **Relationships:**
  - `user`: Links to the `User` model, representing the user who sent the invitation.
  - `organization`: Links to the `Organization` model, representing the organization the invitation is for.

### Note

- **Fields:**
  - `id`: Unique identifier for each note.
  - `title`: Title of the note.
  - `path`: Unique path for the note.
  - `creatorId`: Foreign key linking to the `User` model.
  - `ownerId`: Optional foreign key linking to the `User` model.
  - `organizationId`: Optional foreign key linking to the `Organization` model.
  - `isPublic`: Boolean indicating if the note is public.
  - `createdAt`: Timestamp of when the note was created.
  - `updatedAt`: Timestamp of the last update to the note.
- **Relationships:**
  - `creator`: Links to the `User` model, representing the user who created the note.
  - `organization`: Links to the `Organization` model, representing the organization the note belongs to.
  - `owner`: Links to the `User` model, representing the owner of the note.
  - `collaborators`: Links to the `NoteCollaborator` model, representing users who collaborate on the note.

### NoteCollaborator

- **Fields:**
  - `id`: Unique identifier for each note collaborator.
  - `noteId`: Foreign key linking to the `Note` model.
  - `userId`: Foreign key linking to the `User` model.
  - `canEdit`: Boolean indicating if the collaborator can edit the note.
  - `createdAt`: Timestamp of when the collaboration was created.
- **Relationships:**
  - `note`: Links to the `Note` model, representing the note being collaborated on.
  - `user`: Links to the `User` model, representing the user who is a collaborator.

## Database Relations

- **One-to-Many:**
  - Users can have multiple accounts, sessions, and notes.
  - Organizations can have multiple members and notes.
- **Many-to-Many:**
  - Users can collaborate on multiple notes, and notes can have multiple collaborators.

This schema supports a collaborative note-taking application, where users can create, own, and collaborate on notes within organizations. The relationships ensure data integrity across users, notes, and organizations.
