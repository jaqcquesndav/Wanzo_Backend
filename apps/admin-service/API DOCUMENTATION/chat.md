# Chat API Documentation

This document outlines the API endpoints for the Chat module.

## Chat Session Management

### 1. Get All Chat Sessions

*   **HTTP Method:** `GET`
*   **URL:** `/api/chat/sessions`
*   **Query Parameters:**
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
*   **URL:** `/api/chat/sessions/{sessionId}`
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
*   **URL:** `/api/chat/sessions`
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
*   **URL:** `/api/chat/sessions/{sessionId}/close`
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
*   **URL:** `/api/chat/sessions/{sessionId}/assign`
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
*   **URL:** `/api/chat/sessions/{sessionId}/messages`
*   **Query Parameters:**
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
          "attachments": [
            {
              "id": "string",
              "url": "string",
              "type": "string", // e.g., 'image/jpeg', 'application/pdf'
              "name": "string",
              "size": "number" // in bytes
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
*   **URL:** `/api/chat/sessions/{sessionId}/messages`
*   **Request Structure (JSON or FormData):**
    *   If sending only text:
        ```json
        {
          "content": "string"
        }
        ```
    *   If sending with attachments (use `multipart/form-data`):
        *   `content`: "string"
        *   `attachments[]`: File objects
*   **Response Structure (JSON):**
    ```json
    {
      "id": "string",
      "content": "string",
      "sender": "user" | "support", // depends on who sent it
      "timestamp": "Date",
      "read": false,
      "attachments": [ // if any were uploaded
        {
          "id": "string",
          "url": "string", // URL to access the attachment
          "type": "string",
          "name": "string",
          "size": "number"
        }
      ] (optional)
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If content is missing/invalid, or attachment is invalid/too large.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to send messages in this session.
    *   `404 Not Found`: If the chat session with `sessionId` does not exist.
    *   `409 Conflict`: If the session is closed and no more messages can be sent.
    *   `500 Internal Server Error`: For unexpected server issues.

### 3. Mark Messages as Read

*   **HTTP Method:** `PUT`
*   **URL:** `/api/chat/sessions/{sessionId}/read`
*   **Request Structure (JSON):**
    ```json
    {
      "messageIds": ["string"]
    }
    ```
*   **Response Structure:** (Status 204 No Content or similar success status)
*   **Error Responses:**
    *   `400 Bad Request`: If `messageIds` are missing or invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to mark messages as read in this session.
    *   `404 Not Found`: If the chat session or specified messages do not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

## Attachments

### 1. Download Attachment

*   **HTTP Method:** `GET`
*   **URL:** `/api/chat/attachments/{attachmentId}`
*   **Request Structure:** (None)
*   **Response Structure:** `Blob` (The file content)
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to download this attachment.
    *   `404 Not Found`: If the attachment with `attachmentId` does not exist.
    *   `500 Internal Server Error`: For unexpected server issues.

## Real-time Events (via WebSockets)

The following events are typically handled via a WebSocket connection established for a chat session. The exact mechanism for establishing the WebSocket connection (e.g., an upgrade request on an HTTP endpoint or a dedicated WebSocket URL) needs to be defined by the backend.

### 1. Subscribe to Chat Updates

*   **Action:** Client subscribes to a specific chat session (e.g., `/ws/chat/{sessionId}`).
*   **Events Received by Client:**
    *   **New Message:**
        ```json
        {
          "type": "NEW_MESSAGE",
          "payload": {
            "id": "string",
            "content": "string",
            "sender": "user" | "support",
            "timestamp": "Date",
            "read": "boolean",
            "attachments": [ /* ... ChatAttachment structure ... */ ] (optional),
            "sessionId": "string"
          }
        }
        ```
    *   **Typing Event:**
        ```json
        {
          "type": "TYPING_EVENT",
          "payload": {
            "sessionId": "string",
            "userId": "string", // User who is typing
            "isTyping": "boolean",
            "timestamp": "Date"
          }
        }
        ```
    *   **Session Update (e.g., agent assigned, session closed):**
        ```json
        {
          "type": "SESSION_UPDATE",
          "payload": { /* ... ChatSession structure ... */ }
        }
        ```

### 2. Send Typing Event (Client to Server)

*   **Action:** Client sends a typing indicator to the server.
*   **Endpoint (Conceptual, could be part of WebSocket messages or a separate HTTP POST):** `/api/chat/sessions/{sessionId}/typing`
*   **Request Structure (JSON if HTTP):**
    ```json
    {
      "isTyping": "boolean"
      // userId might be inferred from auth context
    }
    ```
*   **Response (if HTTP):** (Status 204 No Content or similar success status)
*   **Error Responses (if HTTP for typing event):**
    *   `400 Bad Request`: If the payload is invalid.
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user cannot send typing events for this session.
    *   `404 Not Found`: If the chat session does not exist.
    *   `409 Conflict`: If the session is closed.
    *   `500 Internal Server Error`: For unexpected server issues.
*   **WebSocket Message (Client to Server):**
    ```json
    {
      "action": "TYPING",
      "payload": {
        "isTyping": "boolean"
      }
    }
    ```

## Chat Statistics

### 1. Get Chat Statistics

*   **HTTP Method:** `GET`
*   **URL:** `/api/chat/stats`
*   **Request Structure:** (None)
*   **Response Structure (JSON):**
    ```json
    {
      "totalSessions": "number",
      "activeSessions": "number",
      "averageResponseTime": "number", // in seconds or milliseconds
      "messagesExchanged": "number"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the user is not authenticated.
    *   `403 Forbidden`: If the user does not have permission to view chat statistics.
    *   `500 Internal Server Error`: For unexpected server issues.
