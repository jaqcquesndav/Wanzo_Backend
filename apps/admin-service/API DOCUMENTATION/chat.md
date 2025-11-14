# Chat API Documentation

This document outlines the API endpoints for the Chat module.

## Base URL

- **Via API Gateway**: `http://localhost:8000/admin/api/v1`
- **Direct (admin-service)**: `http://localhost:3001`

**Routing Architecture**: API Gateway strips `admin/api/v1` prefix before routing to admin-service.

**Example flow**:
- Client → `http://localhost:8000/admin/api/v1/chat/sessions`
- Gateway strips → `/admin/api/v1`
- Admin-service receives → `http://localhost:3001/chat/sessions`
- Controller → `@Controller('chat')`

## Standard Response Types

### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

### APIResponse<T>
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
}
```

## Chat Session Management

### 1. Get All Chat Sessions

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/chat/sessions`
*   **Query Parameters:
    *   `status` (optional): `active` | `closed` - Filter sessions by status.
    *   `page` (optional): `number` - For pagination.
    *   `limit` (optional): `number` - Number of sessions per page.
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "sessions": [
        {
          "id": "string",
          "userId": "string",
          "agentId": "string" (optional),
          "status": "active" | "closed",
          "startedAt": "Date",
          "endedAt": "Date" (optional),
          "subject": "string" (optional),
          "priority": "low" | "medium" | "high",
          "tags": ["string"] (optional)
        }
      ],
      "totalCount": "number"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If query parameters are invalid (e.g., non-numeric `page` or `limit`).
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to view sessions.
    *   `500 Internal Server Error`: For unexpected server issues.

### 2. Get Chat Session by ID

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "userId": "string",
      "agentId": "string" (optional),
      "status": "active" | "closed",
      "startedAt": "Date",
      "endedAt": "Date" (optional),
      "subject": "string" (optional),
      "priority": "low" | "medium" | "high",
      "tags": ["string"] (optional)
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to view this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

### 3. Create New Chat Session

*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/chat/sessions`
*   **Request Structure (JSON):**
    ```json
    {
      "subject": "string" (optional),
      "priority": "low" | "medium" | "high" (optional, defaults to 'medium'),
      "tags": ["string"] (optional)
      // Potentially userId if initiated by admin, or inferred from auth context
    }
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "userId": "string",
      "agentId": null,
      "status": "active",
      "startedAt": "Date",
      "endedAt": null,
      "subject": "string" (optional),
      "priority": "low" | "medium" | "high",
      "tags": ["string"] (optional)
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request body is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to create a session.
    *   `500 Internal Server Error`: For unexpected server issues.

### 4. Close Chat Session

*   **HTTP Method:** `PUT`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}/close`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "userId": "string",
      "agentId": "string" (optional),
      "status": "closed",
      "startedAt": "Date",
      "endedAt": "Date",
      "subject": "string" (optional),
      "priority": "low" | "medium" | "high",
      "tags": ["string"] (optional)
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to close this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `409 Conflict`: If the session is already closed.
    *   `500 Internal Server Error`: For unexpected server issues.

### 5. Assign Agent to Chat Session

*   **HTTP Method:** `PUT`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}/assign`
*   **Request Structure (JSON):**
    ```json
    {
      "agentId": "string"
    }
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "userId": "string",
      "agentId": "string",
      "status": "active",
      "startedAt": "Date",
      "endedAt": null,
      "subject": "string" (optional),
      "priority": "low" | "medium" | "high",
      "tags": ["string"] (optional)
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If `agentId` is missing or invalid, or session is not assignable.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user (e.g., not an admin) does not have permission to assign agents.
    *   `404 Not Found`: If the chat session or `agentId` does not exist.
    *   `409 Conflict`: If the session is already assigned or closed.
    *   `500 Internal Server Error`: For unexpected server issues.

## Chat Messages

### 1. Get Messages for a Session

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}/messages`
*   **Query Parameters:
    *   `before` (optional): `string` - ID of the message before which to fetch (for pagination).
    *   `limit` (optional): `number` - Number of messages to fetch.
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "messages": [
        {
          "id": "string",
          "content": "string",
          "sender": "user" | "support",
          "timestamp": "Date",
          "read": "boolean",
          "status": "sending" | "sent" | "delivered" | "read" | "failed",
          "attachments": [
            {
              "id": "string",
              "url": "string",
              "type": "string", // e.g., 'image/jpeg', 'application/pdf'
              "name": "string",
              "size": "number", // in bytes
              "metadata": {
                "width": "number", // for images
                "height": "number", // for images
                "duration": "number" // for audio/video
              }
            }
          ] (optional)
        }
      ],
      "totalCount": "number",
      "hasMore": "boolean"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If query parameters are invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to access messages for this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

### 2. Send Message in a Session

*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}/messages`
*   **Request Structure: 
    * For text-only messages (JSON):
    ```json
    {
      "content": "string"
    }
    ```
    * For messages with attachments (Multipart Form):
    ```
    content: "string"
    attachments[0]: File
    attachments[1]: File
    ...
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "content": "string",
      "sender": "user" | "support",
      "timestamp": "Date",
      "read": false,
      "status": "sent",
      "attachments": [
        {
          "id": "string",
          "url": "string",
          "type": "string",
          "name": "string",
          "size": "number",
          "metadata": {
            "width": "number",
            "height": "number",
            "duration": "number"
          }
        }
      ] (optional)
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request body is invalid or attachments exceed size limits.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to send messages in this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `409 Conflict`: If the session is closed and not accepting new messages.
    *   `500 Internal Server Error`: For unexpected server issues.

### 3. Download Attachment

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/chat/attachments/{attachmentId}`
*   **Request Structure:** (None)
*   **Response:** The file content with appropriate Content-Type header
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to download this attachment.
    *   `404 Not Found`: If the attachment with `attachmentId` does not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

### 4. Mark Messages as Read

*   **HTTP Method:** `PUT`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}/read`
*   **Request Structure (JSON):
    ```json
    {
      "messageIds": ["string"]
    }
    ```
*   **Response Structure:** No content (204)
*   **Error Responses:**
    *   `400 Bad Request`: If the request body is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to mark messages in this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

### 5. Send Typing Event

*   **HTTP Method:** `POST`
*   **URL:** `/admin/api/v1/chat/sessions/{sessionId}/typing`
*   **Request Structure (JSON):
    ```json
    {
      "isTyping": "boolean"
    }
    ```
*   **Response Structure:** No content (204)
*   **Error Responses:**
    *   `400 Bad Request`: If the request body is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to send typing events in this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

## Chat Statistics

### 1. Get Chat Statistics

*   **HTTP Method:** `GET`
*   **URL:** `/admin/api/v1/chat/stats`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "totalSessions": "number",
      "activeSessions": "number",
      "averageResponseTime": "number", // in minutes
      "messagesExchanged": "number"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to view chat statistics.
    *   `500 Internal Server Error`: For unexpected server issues.

## Real-time Chat Updates

The chat system uses WebSockets to provide real-time updates for:

1. New messages
2. Typing indicators
3. Session status changes

Clients should establish a WebSocket connection to receive these updates.

### WebSocket Connection

*   **URL:** `wss://api.example.com/ws/chat/{sessionId}`
*   **Authorization:** Bearer token in the connection request

### WebSocket Events

*   **New Message Event:**
    ```json
    {
      "type": "message",
      "data": {
        // Message object as described in Get Messages
      }
    }
    ```

*   **Typing Event:**
    ```json
    {
      "type": "typing",
      "data": {
        "userId": "string",
        "isTyping": "boolean",
        "timestamp": "Date"
      }
    }
    ```

*   **Session Update Event:**
    ```json
    {
      "type": "session_update",
      "data": {
        // Session object as described in Get Session
      }
    }
    ```

## Type Definitions

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'support';
  timestamp: Date;
  read: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: ChatAttachment[];
}
```

### ChatAttachment

```typescript
interface ChatAttachment {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: unknown;
  };
}
```

### ChatSession

```typescript
interface ChatSession {
  id: string;
  userId: string;
  agentId?: string;
  status: 'active' | 'closed';
  startedAt: Date;
  endedAt?: Date;
  subject?: string;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
}
```

### ChatTypingEvent

```typescript
interface ChatTypingEvent {
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}
```
