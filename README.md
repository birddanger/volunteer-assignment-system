# Volunteer Assignment System

A comprehensive web application for managing volunteer role assignments for synchronized swimming competitions and similar events.

## Features

✅ **Event Management** - Create events with sessions and tasks
✅ **Volunteer Accounts** - Simple registration and login
✅ **Task Assignment** - Manual assignment and self sign-up
✅ **Conflict Prevention** - Automatic detection of overlapping assignments
✅ **Email Notifications** - Confirmation and reminder emails
✅ **Admin Dashboard** - Overview of all assignments and tasks
✅ **Data Export** - CSV export for offline coordination

## Project Structure

```
volunteer-assignment-system/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Data models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, error handling
│   │   ├── db/           # Database setup & seeding
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/             # React/TypeScript UI
    ├── src/
    │   ├── pages/        # Page components
    │   ├── components/   # Reusable components
    │   ├── services/     # API client
    │   ├── hooks/        # Custom hooks
    │   ├── types/        # TypeScript types
    │   ├── App.tsx       # Main app
    │   └── main.tsx      # Entry point
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── .env.example
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Clone and navigate:**
   ```bash
   cd volunteer-assignment-system/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Setup database:**
   ```bash
   npm run db:setup
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd volunteer-assignment-system/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   App runs on `http://localhost:3000`

## Default Test Accounts

After seeding, these accounts are available:

**Organizer:**
- Email: `admin@example.com`
- Password: `admin123`

**Volunteers:**
- Email: `volunteer1@example.com` - `volunteer5@example.com`
- Password: `volunteer1` - `volunteer5`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new volunteer
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Events
- `POST /api/events` - Create event (organizers only)
- `GET /api/events` - List events
- `GET /api/events/:eventId` - Get event details
- `PUT /api/events/:eventId` - Update event (organizers only)

### Sessions
- `POST /api/events/:eventId/sessions` - Create session
- `GET /api/events/:eventId/sessions` - List sessions

### Tasks
- `POST /api/events/:eventId/tasks` - Create task (organizers only)
- `GET /api/events/:eventId/tasks` - List tasks
- `POST /api/events/:eventId/tasks/:taskId/signup` - Self sign-up for task

### Assignments
- `POST /api/assignments/assign` - Manual assignment (organizers only)
- `DELETE /api/assignments/:assignmentId` - Unassign volunteer (organizers only)
- `GET /api/assignments/my-assignments` - Get user's assignments
- `GET /api/assignments/available/:eventId` - Get available tasks
- `GET /api/assignments/dashboard/:eventId` - Admin dashboard data
- `GET /api/assignments/export/:eventId` - Export assignments as CSV

## Database Schema

### Users
- user_id (UUID)
- email (unique)
- password_hash
- first_name, last_name
- phone, swimmer_team
- is_organizer (boolean)
- email_verified (boolean)
- created_at, updated_at

### Events
- event_id (UUID)
- name, start_date, end_date, location
- description
- created_by (user_id)
- created_at, updated_at

### Sessions
- session_id (UUID)
- event_id (FK)
- name, date, start_time, end_time
- location
- created_at, updated_at

### Tasks
- task_id (UUID)
- session_id (FK), event_id (FK)
- title, description, instructions
- start_time, end_time
- required_volunteers
- status (Open, Partially Filled, Filled)
- created_at, updated_at

### Assignments
- assignment_id (UUID)
- task_id (FK), user_id (FK)
- assigned_by (organizer user_id)
- assigned_at
- status (Assigned, Confirmed, Completed, Cancelled)

### Notifications
- notification_id (UUID)
- user_id (FK), assignment_id (FK)
- type (Confirmation, Reminder, Manual)
- sent_at, status (Sent, Failed, Bounced)
- created_at

## Key Features

### Conflict Prevention
The system automatically detects and prevents overlapping assignments when:
- A volunteer self-signs up for a task
- An organizer manually assigns a volunteer

If a conflict is detected, the user receives a clear error message with details about the conflicting task.

### Email Notifications
Sent automatically when:
1. **Confirmation Email** - Immediately after assignment
2. **Reminder Email** - 24 hours before task starts
3. **Manual Email** - Organizer can send custom messages

Configure email in `.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@volunteerapp.com
```

### Admin Dashboard
Organizers can:
- View all tasks with assignment status
- Identify unfilled roles
- Export all assignments to CSV
- See volunteer overview and metrics

### Volunteer Dashboard
Volunteers can:
- View their assigned tasks
- Browse available open tasks
- Self sign-up for tasks
- Get task details and instructions

## Development

### Build Backend
```bash
cd backend
npm run build
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Type Checking
```bash
npm run typecheck
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteer_system
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@volunteerapp.com
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Production Deployment

1. Build both applications
2. Configure environment variables for production
3. Setup PostgreSQL database
4. Configure email service (SendGrid, AWS SES, etc.)
5. Deploy backend to hosting (Heroku, Railway, etc.)
6. Deploy frontend to CDN (Vercel, Netlify, etc.)
7. Update CORS settings and API URLs

## License

MIT
