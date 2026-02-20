# Backend API Documentation

## Overview

Express.js + TypeScript backend for the Volunteer Assignment System. Handles authentication, event management, task scheduling, and volunteer assignment with automatic conflict detection.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Authentication:** JWT
- **Email:** Nodemailer
- **ORM:** Raw SQL with pg

## Getting Started

### Installation

```bash
cd backend
npm install
```

### Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteer_system
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-very-secret-key-change-in-production
JWT_EXPIRY=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@volunteerapp.com
FRONTEND_URL=http://localhost:3000
```

### Database Setup

Initialize database schema:

```bash
npm run db:setup
```

Seed with sample data:

```bash
npm run db:seed
```

### Development

Start with auto-reload:

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Production

Build TypeScript:

```bash
npm run build
```

Start server:

```bash
npm start
```

## API Routes

### POST /api/auth/register

Register a new volunteer account.

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "swimmer_team": "Team A"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "email": "parent@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "token": "jwt-token"
}
```

### POST /api/auth/login

Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "email": "parent@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_organizer": false,
  "token": "jwt-token"
}
```

### GET /api/auth/profile

Get authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user_id": "uuid",
  "email": "parent@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "swimmer_team": "Team A",
  "is_organizer": false,
  "created_at": "2026-02-14T10:00:00Z"
}
```

### PUT /api/auth/profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "phone": "555-5678",
  "swimmer_team": "Team B"
}
```

### POST /api/events

Create an event (organizers only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Regional Synchronized Swimming Championship",
  "start_date": "2026-02-20",
  "end_date": "2026-02-22",
  "location": "Municipal Sports Complex",
  "description": "Weekend championship event"
}
```

**Response:**
```json
{
  "event_id": "uuid",
  "name": "Regional Synchronized Swimming Championship",
  "start_date": "2026-02-20",
  "end_date": "2026-02-22",
  "location": "Municipal Sports Complex",
  "description": "Weekend championship event"
}
```

### GET /api/events

List all events.

**Response:**
```json
[
  {
    "event_id": "uuid",
    "name": "Regional Synchronized Swimming Championship",
    "start_date": "2026-02-20",
    "end_date": "2026-02-22",
    "location": "Municipal Sports Complex",
    "created_at": "2026-02-14T10:00:00Z"
  }
]
```

### GET /api/events/:eventId

Get specific event details.

### POST /api/events/:eventId/sessions

Create a session within an event (organizers only).

**Request:**
```json
{
  "name": "Friday Evening - Setup",
  "date": "2026-02-20",
  "start_time": "17:00",
  "end_time": "19:00",
  "location": "Municipal Sports Complex"
}
```

### GET /api/events/:eventId/sessions

List sessions for an event.

### POST /api/events/:eventId/tasks

Create a task within a session (organizers only).

**Request:**
```json
{
  "session_id": "uuid",
  "title": "Poolside Judge",
  "description": "Judging synchronized swimming performance",
  "instructions": "Please arrive 15 minutes early",
  "start_time": "08:00",
  "end_time": "12:00",
  "required_volunteers": 4
}
```

### GET /api/events/:eventId/tasks

List all tasks for an event.

### POST /api/events/:eventId/tasks/:taskId/signup

Self sign-up for a task.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "assignment_id": "uuid",
  "task_id": "uuid",
  "status": "Confirmed"
}
```

**Conflict Response (409):**
```json
{
  "error": "Time conflict detected",
  "conflict": {
    "task_id": "uuid",
    "title": "Other Task",
    "start_time": "09:00",
    "end_time": "11:00"
  }
}
```

### POST /api/assignments/assign

Manually assign a volunteer to a task (organizers only).

**Request:**
```json
{
  "task_id": "uuid",
  "volunteer_id": "uuid",
  "force": false
}
```

Set `force: true` to override time conflict warnings.

### DELETE /api/assignments/:assignmentId

Unassign a volunteer (organizers only).

### GET /api/assignments/my-assignments

Get user's task assignments.

**Response:**
```json
[
  {
    "assignment_id": "uuid",
    "task_id": "uuid",
    "title": "Poolside Judge",
    "start_time": "08:00",
    "end_time": "12:00",
    "session_name": "Saturday Morning - Preliminaries",
    "date": "2026-02-21",
    "event_location": "Municipal Sports Complex",
    "status": "Confirmed",
    "assigned_at": "2026-02-14T10:00:00Z"
  }
]
```

### GET /api/assignments/available/:eventId

Get list of open tasks for an event.

**Response:**
```json
[
  {
    "task_id": "uuid",
    "title": "Poolside Judge",
    "description": "Judging synchronized swimming performance",
    "start_time": "08:00",
    "end_time": "12:00",
    "required_volunteers": 4,
    "assigned_count": 2,
    "session_name": "Saturday Morning - Preliminaries",
    "date": "2026-02-21",
    "location": "Municipal Sports Complex"
  }
]
```

### GET /api/assignments/dashboard/:eventId

Get admin dashboard data (organizers only).

**Response:**
```json
{
  "tasks": [
    {
      "task_id": "uuid",
      "title": "Poolside Judge",
      "session_name": "Saturday Morning - Preliminaries",
      "date": "2026-02-21",
      "start_time": "08:00",
      "end_time": "12:00",
      "required_volunteers": 4,
      "assigned_count": 3,
      "status": "Partially Filled"
    }
  ],
  "summary": {
    "total_volunteers": 15,
    "total_assignments": 32
  }
}
```

### GET /api/assignments/export/:eventId

Export assignments as CSV (organizers only).

**Response:** CSV file with columns:
- First Name, Last Name, Email, Phone
- Task, Start Time, End Time
- Session, Date, Location, Event
- Assigned At

## Error Handling

All errors return consistent format:

```json
{
  "error": "Error message",
  "details": "Additional context (development only)"
}
```

Common status codes:
- **400** - Bad request (missing/invalid fields)
- **401** - Unauthorized (invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not found
- **409** - Conflict (e.g., duplicate booking)
- **500** - Server error

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <jwt-token>
```

Token is valid for 7 days by default (configurable via JWT_EXPIRY).

## Database Transactions

The system uses PostgreSQL with automatic transaction handling for:
- Assignment creation (prevents double-booking)
- Task status updates
- Notification logging

## Email Service

Configured via environment variables. Supports:
- Gmail (with app-specific passwords)
- SendGrid
- AWS SES
- Other SMTP providers

Emails are sent asynchronously for:
- Task assignment confirmation
- 24-hour task reminders
- Manual organizer messages

## Development Notes

- All routes use async/await pattern
- Input validation on controller level
- Business logic in service layer
- Database queries in pool (no ORM)
- TypeScript strict mode enabled

## Testing

To test endpoints, use curl or Postman:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get profile (with token)
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
