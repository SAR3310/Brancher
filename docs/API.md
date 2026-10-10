# Brancher API Documentation (OpenAPI 3.0)

**Version**: 1.0.0  
**Date**: 2026-09-30  
**Server**: https://api.brancher.com/api

---

## 1. API Overview

Brancher API adalah REST API dengan WebSocket support untuk real-time communication. 

### Base URL
- **Production**: `https://api.brancher.com/api`
- **Development**: `http://localhost:3000/api`

### API Version
- **Current**: `v1` (default)
- **Versioning**: URL-based (`/api/v1/...`)

### Response Format
Semua response dalam JSON format dengan struktur yang konsisten.

---

## 2. Authentication

### Methods Supported
1. **Session-based** (default)
   - Cookie dengan session ID
   - Persistent across requests
   - Logout clears session

2. **JWT Token** (future v0.3.0)
   - Bearer token in Authorization header
   - Refresh token support

3. **OAuth 2.0** (future v0.3.0)
   - Google, GitHub, Discord
   - Authorization code flow

### Current Implementation (v0.1.0)
```
All requests automatically authenticated via Express session.
Session validated on every request.
Logout destroys session server-side.
```

### Headers Required
```http
Cookie: connect.sid=session-id-here
Content-Type: application/json
```

---

## 3. Authentication Endpoints

### POST /register

**Description**: Register new user

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Validation**:
- username: 3-20 chars, alphanumeric + underscore only
- email: Valid email format
- password: Min 6 characters

**Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "usr_123abc",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2026-09-30T10:30:00Z"
  },
  "session": {
    "id": "session-123",
    "expiresAt": "2026-10-30T10:30:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed (username exists, invalid format)
- `429 Too Many Requests`: Rate limit exceeded (30 per 15 min)
- `500 Internal Server Error`: Server error

**Rate Limit**: 30 attempts per 15 minutes per IP

---

### POST /login

**Description**: Login with email/username and password

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Alternative**:
```json
{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "usr_123abc",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Rate Limit**: 30 attempts per 15 minutes per IP

---

### POST /logout

**Description**: Logout current user

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "success": true
}
```

---

### GET /me

**Description**: Get current authenticated user

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "user": {
    "id": "usr_123abc",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2026-09-30T10:30:00Z",
    "status": "online",
    "lastSeen": "2026-09-30T14:20:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated

---

### GET /first-run

**Description**: Check apakah user adalah first-time user (belum bergabung di branch manapun). Gunakan ini untuk mendeteksi perlu tampilkan onboarding modal.

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "isFirstRun": true,
  "branchCount": 0
}
```

**When isFirstRun = true**: User baru, belum ada di branch apapun → tampilkan modal onboarding ("Buat atau Bergabung")

**When isFirstRun = false**: User sudah di satu atau lebih branch → skip onboarding, tampilkan normal UI

**Errors**:
- `401 Unauthorized`: Not authenticated

---

### GET /health

**Description**: Health check endpoint untuk monitoring server status. Tidak memerlukan authentication. Cocok untuk uptime monitoring tools seperti Uptime Robot, Healthchecks.io, dll.

**Authentication**: Not required

**Response (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-07T10:30:00.000Z",
  "uptime": 3600,
  "version": "0.1.0",
  "environment": "production",
  "database": {
    "status": "connected",
    "users": 125,
    "branches": 8,
    "messages": 3420,
    "activeConnections": 12
  },
  "memory": {
    "heapUsedMB": 45,
    "heapTotalMB": 128
  }
}
```

**Response (503 Service Unavailable)** - saat database error:
```json
{
  "status": "error",
  "timestamp": "2026-10-07T10:30:00.000Z",
  "message": "Database connection failed"
}
```

**Use Cases**:
- **Uptime Monitoring**: Polling `/health` setiap 5 menit
- **Alerting**: Kalau response bukan 200, kirim alert ke admin
- **Status Dashboard**: Display stats (users, branches, messages, active connections)
- **Resource Planning**: Monitor memory usage trend untuk capacity planning

**Example Monitoring Setup**:
```bash
# Uptime Robot
# URL: https://brancher.sekolah.sch.id/api/health
# Interval: 5 minutes
# Alert: Email admin jika down

# Shell script polling
while true; do
  status=$(curl -s -o /dev/null -w "%{http_code}" https://brancher.sekolah.sch.id/api/health)
  if [ $status != "200" ]; then
    echo "Alert: Brancher is down! Status: $status"
    # sendmail admin@sekolah.sch.id ...
  fi
  sleep 300
done
```

---

## 4. Branches Endpoints

### GET /branches

**Description**: List user's branches

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page (max: 100) |
| offset | integer | 0 | Skip items |
| sort | string | created_at | Sort by: created_at, name |
| order | string | desc | asc or desc |

**Response (200 OK)**:
```json
{
  "branches": [
    {
      "id": "br_abc123",
      "name": "Tech Community",
      "description": "Discussion about technology",
      "ownerUsername": "john_doe",
      "memberCount": 42,
      "channelCount": 5,
      "role": "owner",
      "createdAt": "2026-09-01T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### POST /branches

**Description**: Create new branch

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Tech Community",
  "description": "Discussion about technology"
}
```

**Validation**:
- name: 3-100 chars, required
- description: 0-500 chars, optional

**Response (201 Created)**:
```json
{
  "success": true,
  "branch": {
    "id": "br_abc123",
    "name": "Tech Community",
    "description": "Discussion about technology",
    "inviteCode": "invite_code_123",
    "ownerUsername": "john_doe",
    "memberCount": 1,
    "role": "owner",
    "createdAt": "2026-09-30T14:20:00Z",
    "channels": [
      {
        "id": "ch_001",
        "name": "pengumuman",
        "type": "announce",
        "position": 1
      },
      {
        "id": "ch_002",
        "name": "umum",
        "type": "text",
        "position": 2
      },
      {
        "id": "ch_003",
        "name": "santai",
        "type": "text",
        "position": 3
      }
    ]
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Not authenticated

---

### GET /branches/:id

**Description**: Get branch details

**Authentication**: Required

**Path Parameters**:
- id (string): Branch ID

**Response (200 OK)**:
```json
{
  "branch": {
    "id": "br_abc123",
    "name": "Tech Community",
    "description": "Discussion about technology",
    "ownerUsername": "john_doe",
    "memberCount": 42,
    "role": "member",
    "createdAt": "2026-09-01T10:00:00Z",
    "channels": [
      {
        "id": "ch_001",
        "name": "pengumuman",
        "type": "announce",
        "position": 1,
        "messageCount": 125
      }
    ],
    "members": [
      {
        "userId": "usr_123",
        "username": "john_doe",
        "role": "owner",
        "joinedAt": "2026-09-01T10:00:00Z"
      }
    ]
  }
}
```

**Errors**:
- `404 Not Found`: Branch doesn't exist
- `403 Forbidden`: User not member of branch

---

### DELETE /branches/:id

**Description**: Delete branch (owner only)

**Authentication**: Required  
**Permission**: Owner only

**Path Parameters**:
- id (string): Branch ID

**Response (200 OK)**:
```json
{
  "success": true
}
```

**Errors**:
- `403 Forbidden`: User is not owner
- `404 Not Found`: Branch doesn't exist

---

### POST /branches/:id/leave

**Description**: Leave branch

**Authentication**: Required

**Path Parameters**:
- id (string): Branch ID

**Response (200 OK)**:
```json
{
  "success": true
}
```

**Errors**:
- `403 Forbidden`: Cannot leave if owner
- `404 Not Found`: Branch doesn't exist

---

## 5. Channels Endpoints

### POST /branches/:branchId/channels

**Description**: Create channel (admin+ only)

**Authentication**: Required  
**Permission**: Admin or Owner

**Request Body**:
```json
{
  "name": "random",
  "type": "text",
  "position": 4
}
```

**Types**:
- `text`: Regular channel
- `announce`: Announcement only (staff can post)
- `voice`: Voice channel (placeholder)

**Response (201 Created)**:
```json
{
  "success": true,
  "channel": {
    "id": "ch_004",
    "branchId": "br_abc123",
    "name": "random",
    "type": "text",
    "position": 4,
    "createdAt": "2026-09-30T14:20:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Branch doesn't exist

---

### DELETE /channels/:id

**Description**: Delete channel (admin+ only)

**Authentication**: Required  
**Permission**: Admin or Owner

**Path Parameters**:
- id (string): Channel ID

**Response (200 OK)**:
```json
{
  "success": true
}
```

---

## 6. Messages Endpoints

### GET /messages/channel/:channelId

**Description**: Get channel messages (paginated)

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Messages per page (max: 100) |
| offset | integer | 0 | Skip messages (for pagination) |
| before | string | - | Timestamp before this |

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "msg_123",
      "channelId": "ch_001",
      "userId": "usr_123abc",
      "username": "john_doe",
      "content": "Hello everyone!",
      "fileUrl": null,
      "replyTo": null,
      "pinned": false,
      "edited": false,
      "reactions": {
        "👍": ["usr_123", "usr_456"],
        "❤️": ["usr_789"]
      },
      "createdAt": "2026-09-30T10:30:00Z",
      "updatedAt": "2026-09-30T10:30:00Z"
    }
  ],
  "total": 500,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

### GET /messages/dm/:otherId

**Description**: Get DM conversation with user

**Authentication**: Required

**Query Parameters**: Same as channel messages

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "msg_dm_123",
      "dmKey": "usr_123abc|usr_456def",
      "fromUserId": "usr_123abc",
      "toUserId": "usr_456def",
      "content": "Hey, how are you?",
      "fileUrl": null,
      "reactions": {},
      "createdAt": "2026-09-30T10:30:00Z"
    }
  ],
  "total": 42,
  "hasMore": false
}
```

---

### GET /messages/pinned/:channelId

**Description**: Get pinned messages in channel

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "msg_123",
      "channelId": "ch_001",
      "username": "john_doe",
      "content": "Important announcement",
      "pinnedAt": "2026-09-30T10:30:00Z",
      "createdAt": "2026-09-30T10:00:00Z"
    }
  ],
  "total": 3
}
```

---

### GET /search

**Description**: Search messages

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| channelId | string | No | Filter by channel |
| userId | string | No | Filter by user |
| limit | integer | No | Items per page (default: 20) |

**Response (200 OK)**:
```json
{
  "results": [
    {
      "id": "msg_123",
      "channelId": "ch_001",
      "username": "john_doe",
      "content": "Hello everyone!",
      "createdAt": "2026-09-30T10:30:00Z",
      "highlight": "Hello <mark>everyone</mark>!"
    }
  ],
  "total": 5,
  "query": "everyone"
}
```

---

## 7. File Upload Endpoint

### POST /upload

**Description**: Upload file (messages, avatars)

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Form Parameters**:
- `file` (file, required): File to upload (max 10MB)
- `type` (string, optional): 'avatar', 'message' (default: 'message')

**Supported MIME Types**:
- Images: image/jpeg, image/png, image/webp
- Documents: application/pdf
- Archives: application/zip

**Response (200 OK)**:
```json
{
  "success": true,
  "file": {
    "url": "/uploads/msg_123/filename.jpg",
    "name": "filename.jpg",
    "size": 245823,
    "mimeType": "image/jpeg",
    "uploadedAt": "2026-09-30T14:20:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: File too large, invalid format
- `413 Payload Too Large`: Exceeds 10MB limit
- `415 Unsupported Media Type`: MIME type not allowed

---

## 8. Friends Endpoints

### GET /friends

**Description**: Get friends list and friend requests

**Authentication**: Required

**Response (200 OK)**:
```json
{
  "friends": [
    {
      "id": "frnd_123",
      "userId": "usr_456",
      "username": "jane_doe",
      "status": "accepted",
      "sinceAt": "2026-08-01T10:00:00Z",
      "online": true,
      "lastSeen": "2026-09-30T14:15:00Z"
    }
  ],
  "requests": [
    {
      "id": "frnd_456",
      "fromUserId": "usr_789",
      "fromUsername": "bob_smith",
      "status": "pending",
      "sentAt": "2026-09-30T10:00:00Z"
    }
  ],
  "totalFriends": 15,
  "totalRequests": 3
}
```

---

### POST /friends/request

**Description**: Send friend request

**Authentication**: Required

**Request Body**:
```json
{
  "username": "jane_doe"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "friendship": {
    "id": "frnd_123",
    "toUsername": "jane_doe",
    "status": "pending",
    "sentAt": "2026-09-30T14:20:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: User not found, already friends
- `409 Conflict`: Request already sent

---

### POST /friends/:friendshipId/accept

**Description**: Accept friend request

**Authentication**: Required

**Path Parameters**:
- friendshipId (string): Friendship ID

**Response (200 OK)**:
```json
{
  "success": true,
  "friendship": {
    "id": "frnd_123",
    "userId": "usr_789",
    "username": "bob_smith",
    "status": "accepted",
    "acceptedAt": "2026-09-30T14:20:00Z"
  }
}
```

---

### DELETE /friends/:friendshipId

**Description**: Reject/remove friend

**Authentication**: Required

**Path Parameters**:
- friendshipId (string): Friendship ID

**Response (200 OK)**:
```json
{
  "success": true
}
```

---

## 9. Error Response Format

**Standard Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be 3-20 characters",
    "statusCode": 400,
    "details": {
      "field": "username",
      "value": "ab",
      "reason": "Too short (min 3 chars)"
    }
  }
}
```

**Error Codes**:
```
VALIDATION_ERROR      - Input validation failed
AUTHENTICATION_ERROR  - Not authenticated
AUTHORIZATION_ERROR   - Insufficient permissions
NOT_FOUND            - Resource not found
CONFLICT             - Resource already exists
RATE_LIMIT_ERROR     - Rate limit exceeded
SERVER_ERROR         - Internal server error
```

---

## 10. Rate Limiting

### Headers
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1696017600
```

### Limits by Endpoint
```
Authentication:
├── /login: 30 per 15 minutes per IP
├── /register: 30 per 15 minutes per IP
└── /logout: No limit

General endpoints:
├── GET: 100 per 15 minutes per user
├── POST: 50 per 15 minutes per user
└── DELETE: 50 per 15 minutes per user

Messages:
├── Send message: 200 per hour per user
└── Search: 30 per minute per user
```

---

## 11. Pagination

### Query Parameters
```
limit: Number of items (1-100, default 50)
offset: Skip items (default 0)
```

### Response
```json
{
  "data": [...],
  "total": 500,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

### Example
```
GET /api/messages/channel/ch_001?limit=20&offset=40
// Fetch 20 messages, skipping first 40
```

---

## 12. Timestamps

**Format**: ISO 8601 UTC  
**Example**: `2026-09-30T14:20:00Z`

**Timezone**: All timestamps in UTC server time

---

## 13. WebSocket Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity
});
```

### Client → Server Events

**message:channel** - Send channel message
```javascript
socket.emit('message:channel', {
  channelId: 'ch_001',
  content: 'Hello!',
  fileUrl: null,
  replyTo: null
});
```

**message:dm** - Send DM
```javascript
socket.emit('message:dm', {
  toUserId: 'usr_456',
  content: 'Hey!'
});
```

**message:edit** - Edit message
```javascript
socket.emit('message:edit', {
  messageId: 'msg_123',
  content: 'Updated message'
});
```

**message:delete** - Delete message
```javascript
socket.emit('message:delete', {
  messageId: 'msg_123'
});
```

**message:react** - Add/remove reaction
```javascript
socket.emit('message:react', {
  messageId: 'msg_123',
  emoji: '👍',
  action: 'add' // or 'remove'
});
```

**message:pin** - Pin/unpin message
```javascript
socket.emit('message:pin', {
  messageId: 'msg_123',
  action: 'pin' // or 'unpin'
});
```

**typing** - Send typing indicator
```javascript
socket.emit('typing', {
  channelId: 'ch_001',
  isTyping: true
});
```

### Server → Client Events

**message:channel** - New channel message
```javascript
socket.on('message:channel', (data) => {
  // {id, channelId, userId, username, content, createdAt, ...}
});
```

**message:updated** - Message edited or reaction added
```javascript
socket.on('message:updated', (data) => {
  // {id, content, reactions, edited, updatedAt}
});
```

**message:deleted** - Message deleted
```javascript
socket.on('message:deleted', (data) => {
  // {messageId}
});
```

**typing** - User typing indicator
```javascript
socket.on('typing', (data) => {
  // {userId, username, channelId, isTyping}
});
```

**presence** - Online users list
```javascript
socket.on('presence', (data) => {
  // {onlineUsers: [{userId, username, status}]}
});
```

**friends:changed** - Friend list changed
```javascript
socket.on('friends:changed', (data) => {
  // Friend added, removed, or request received
});
```

---

## 14. CORS & HTTPS

### CORS Headers
```
Access-Control-Allow-Origin: https://brancher.com
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### HTTPS
- **Required**: Production environment
- **HSTS**: Enabled (max-age: 31536000)
- **Cookies**: Secure flag, HttpOnly, SameSite=Strict

---

## 15. Versioning & Deprecation

### API Version
Current: `v1`

### Versioning Strategy
- URL-based: `/api/v1/...`, `/api/v2/...`
- Deprecation period: 6 months notice

### Deprecation Headers
```http
Deprecation: true
Sunset: Wed, 31 Mar 2027 23:59:59 GMT
```

---

## 16. Documentation & Support

### OpenAPI Spec
Available at: `/api/v1/swagger.json`

### Interactive API Docs
- Swagger UI: `https://api.brancher.com/docs`
- Postman Collection: Available for import

### Support
- Email: api-support@brancher.com
- Discord: [Support Server](link)
- GitHub Issues: [Report Bugs](link)

---

*API Documentation v1.0*  
*Last Updated: 2026-09-30*  
*OpenAPI 3.0 Specification*  
*Maintained by: API Team*
