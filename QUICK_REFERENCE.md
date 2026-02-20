# Quick Reference Guide

Fast lookup for common operations and endpoints.

## Running the Application

### Start Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Initialize Database (first time only)
```bash
cd backend
npm run db:setup    # Create tables
npm run db:seed     # Add sample data
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Organizer | admin@example.com | admin123 |
| Volunteer | volunteer1@example.com | volunteer1 |
| Volunteer | volunteer2@example.com | volunteer2 |
| Volunteer | volunteer3@example.com | volunteer3 |
| Volunteer | volunteer4@example.com | volunteer4 |
| Volunteer | volunteer5@example.com | volunteer5 |

---

## API Endpoints Cheat Sheet

### Authentication
```
POST   /api/auth/register      Register new account
POST   /api/auth/login         Login and get token
GET    /api/auth/profile       Get user profile
PUT    /api/auth/profile       Update profile
```

### Events (Organizers)
```
POST   /api/events                    Create event
GET    /api/events                    List all events
GET    /api/events/:eventId           Get event details
PUT    /api/events/:eventId           Update event
```

### Sessions (Organizers)
```
POST   /api/events/:eventId/sessions  Create session
GET    /api/events/:eventId/sessions  List sessions
```

### Tasks (Organizers)
```
POST   /api/events/:eventId/tasks           Create task
GET    /api/events/:eventId/tasks           List tasks
GET    /api/events/:eventId/tasks/:taskId   Get task details
POST   /api/events/:eventId/tasks/:taskId/signup  Volunteer sign up
```

### Assignments
```
POST   /api/assignments/assign                Create manual assignment (Organizer)
DELETE /api/assignments/:assignmentId         Delete assignment (Organizer)
GET    /api/assignments/my-assignments        Get my tasks
GET    /api/assignments/available/:eventId    Get open tasks
GET    /api/assignments/dashboard/:eventId    Admin dashboard (Organizer)
GET    /api/assignments/export/:eventId       Export CSV (Organizer)
```

---

## Frontend Routes

| Path | Role | Purpose |
|------|------|---------|
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/dashboard` | Volunteer | My assigned tasks |
| `/setup` | Organizer | Event/session/task creation |
| `/admin` | Organizer | Assignment overview & CSV export |

---

## Database Quick Queries

### See All Users
```sql
SELECT user_id, email, first_name, is_organizer FROM users;
```

### See All Events
```sql
SELECT event_id, name, start_date, end_date FROM events;
```

### See Task Assignment Status
```sql
SELECT t.title, t.required_volunteers, COUNT(a.assignment_id) as assigned
FROM tasks t
LEFT JOIN assignments a ON t.task_id = a.task_id
GROUP BY t.task_id;
```

### See Volunteer Assignments
```sql
SELECT u.first_name, t.title, t.start_time, s.date
FROM assignments a
JOIN users u ON a.user_id = u.user_id
JOIN tasks t ON a.task_id = t.task_id
JOIN sessions s ON t.session_id = s.session_id
ORDER BY s.date, t.start_time;
```

### Reset Database
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE volunteer_system;"
psql -U postgres -c "CREATE DATABASE volunteer_system;"

# Reinitialize
cd backend
npm run db:setup
npm run db:seed
```

---

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

---

## Key Files to Edit

### Backend
- **API Routes** → `backend/src/routes/*.ts`
- **Controllers** → `backend/src/controllers/*.ts`
- **Database** → `backend/src/db/setup.ts`, `seed.ts`
- **Email** → `backend/src/services/emailService.ts`
- **Auth** → `backend/src/middleware/auth.ts`

### Frontend
- **Pages** → `frontend/src/pages/*.tsx`
- **API Client** → `frontend/src/services/apiClient.ts`
- **Types** → `frontend/src/types/index.ts`
- **Styling** → `frontend/src/index.css`
- **Main App** → `frontend/src/App.tsx`

---

## Common Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm run typecheck    # Check TypeScript types
npm run db:setup     # Initialize database
npm run db:seed      # Seed sample data
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
```

---

## Debugging Tips

### Backend Logs
- SQL queries logged to console
- HTTP requests/responses visible
- Email attempts logged (even if not sent)
- Check terminal for error stack traces

### Frontend Logs
- Browser DevTools → Console
- Network tab shows API calls
- React DevTools extension helpful
- Check Application → LocalStorage for token

### Database Issues
```bash
# Connect to database
psql -U postgres -d volunteer_system

# List all tables
\dt

# View table structure
\d table_name

# Exit
\q
```

### Port Already in Use
```bash
# Backend port 5000
lsof -i :5000
kill -9 <PID>

# Frontend port 3000
lsof -i :3000
kill -9 <PID>
```

---

## File Structure Reference

```
volunteer-assignment-system/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, errors
│   │   ├── db/               # Database setup/seed
│   │   ├── types.ts          # TypeScript types
│   │   └── index.ts          # Server entry
│   ├── dist/                 # Compiled JavaScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API client
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx           # Main app
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Tailwind styles
│   ├── dist/                 # Production build
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env.example
│   └── README.md
│
├── MVP_SPECIFICATION.md      # Full feature spec
├── SETUP.md                  # Setup instructions
├── README.md                 # Project overview
└── QUICK_REFERENCE.md        # This file
```

---

## Troubleshooting Checklist

- [ ] PostgreSQL running? `brew services start postgresql`
- [ ] Database exists? `psql -U postgres -d volunteer_system`
- [ ] Backend running on 5000? `npm run dev` in backend folder
- [ ] Frontend running on 3000? `npm run dev` in frontend folder
- [ ] `.env` files copied? `cp .env.example .env`
- [ ] Database initialized? `npm run db:setup && npm run db:seed`
- [ ] Port conflicts? Check `lsof -i :5000` and `:3000`
- [ ] Dependencies installed? `npm install` in both folders
- [ ] Check browser console for errors
- [ ] Check backend terminal for error logs

---

## Next Steps

1. Follow [SETUP.md](SETUP.md) for complete installation
2. Read [MVP_SPECIFICATION.md](MVP_SPECIFICATION.md) for feature details
3. Explore [backend/README.md](backend/README.md) for API docs
4. Check [frontend/README.md](frontend/README.md) for UI docs
5. Start customizing for your event!

---

## Support Resources

- **Node.js & npm**: https://nodejs.org/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **TypeScript**: https://www.typescriptlang.org/
