# Volunteer Assignment System - Documentation Index

## 📚 Start Here

**First time?** → [SETUP.md](SETUP.md) - Complete installation guide (15 minutes)

**Want quick reference?** → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands, endpoints, accounts

**Need the big picture?** → [README.md](README.md) - Project overview

---

## 📖 Documentation Files

### Project-Level Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [MVP_SPECIFICATION.md](MVP_SPECIFICATION.md) | Complete feature specification with requirements | Product managers, stakeholders |
| [SETUP.md](SETUP.md) | Step-by-step installation and configuration guide | Developers, DevOps |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick lookup for commands, endpoints, accounts | All developers |
| [BUILD_SUMMARY.md](BUILD_SUMMARY.md) | What was built and why (this build) | Project leads |
| [README.md](README.md) | Project overview and architecture | New team members |

### Backend Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [backend/README.md](backend/README.md) | API documentation with all endpoints | Backend developers, frontend devs |
| [backend/src/types.ts](backend/src/types.ts) | TypeScript interfaces for all data types | Developers |
| [backend/.env.example](backend/.env.example) | Environment variable template | DevOps, developers |

### Frontend Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [frontend/README.md](frontend/README.md) | Frontend architecture and components | Frontend developers |
| [frontend/src/types/index.ts](frontend/src/types/index.ts) | TypeScript types used in frontend | Frontend developers |
| [frontend/.env.example](frontend/.env.example) | Environment variable template | Frontend developers |

---

## 🎯 Choose Your Path

### 👨‍💻 I'm a Developer - I Want to Code

1. Read [SETUP.md](SETUP.md) - Get it running locally
2. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Bookmark this
3. Read [backend/README.md](backend/README.md) - Understand the API
4. Read [frontend/README.md](frontend/README.md) - Understand the UI
5. Start editing code in `src/` folders

### 🎨 I'm a Designer - I Want to Customize UI

1. Read [SETUP.md](SETUP.md) - Get it running
2. Check [frontend/README.md](frontend/README.md) - Component structure
3. Edit Tailwind CSS in [frontend/src/index.css](frontend/src/index.css)
4. Modify pages in [frontend/src/pages/](frontend/src/pages/)
5. Update colors in [frontend/tailwind.config.js](frontend/tailwind.config.js)

### 📊 I'm a Product Manager - I Want Features

1. Read [MVP_SPECIFICATION.md](MVP_SPECIFICATION.md) - See what's included
2. Read [README.md](README.md) - Understand architecture
3. Reference [BUILD_SUMMARY.md](BUILD_SUMMARY.md) - See what was built
4. Future enhancements section for ideas

### 🚀 I'm a DevOps Engineer - I Want to Deploy

1. Read [SETUP.md](SETUP.md) - Understand local setup
2. Read [backend/.env.example](backend/.env.example) - Environment variables
3. Read [README.md](README.md) - Production section
4. Check deployment examples in docs
5. Configure PostgreSQL, Node.js, and email service

### 👥 I'm a Stakeholder - I Want to Understand the Project

1. Read [BUILD_SUMMARY.md](BUILD_SUMMARY.md) - Quick overview
2. Read [MVP_SPECIFICATION.md](MVP_SPECIFICATION.md) - Full feature list
3. Check [README.md](README.md) - Technical details
4. Review [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Test accounts section

---

## 🗂️ Directory Structure

### Backend
```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, error handling
│   ├── db/               # Database setup & seed
│   ├── types.ts          # TypeScript definitions
│   └── index.ts          # Server entry point
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Frontend
```
frontend/
├── src/
│   ├── pages/            # Page components
│   ├── components/       # Reusable components
│   ├── services/         # API client
│   ├── hooks/            # Custom hooks
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main router
│   ├── main.tsx          # Entry point
│   └── index.css         # Styles
├── dist/                 # Production build
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .env.example
└── README.md
```

---

## 🔑 Quick Commands

### Backend
```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Compile TypeScript
npm run db:setup   # Initialize database
npm run db:seed    # Add sample data
npm run typecheck  # Check types
```

### Frontend
```bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm run build      # Create production build
npm run preview    # Preview build
npm run typecheck  # Check types
```

---

## 🔓 Test Accounts

After setup, use these to test:

```
Organizer:    admin@example.com / admin123
Volunteer 1:  volunteer1@example.com / volunteer1
Volunteer 2:  volunteer2@example.com / volunteer2
...
Volunteer 5:  volunteer5@example.com / volunteer5
```

---

## 📋 Feature Checklist

✅ Event Setup
- Create event with name, dates, location
- Add sessions (time blocks)
- Add tasks with details

✅ Volunteer Accounts
- Registration with email/password
- Login with JWT authentication
- Profile management

✅ Task Assignment
- Manual assignment by organizers
- Self sign-up by volunteers
- Conflict prevention (no double-booking)

✅ Dashboards
- Volunteer: View assignments & available tasks
- Organizer: Overview of all tasks & assignments

✅ Email Notifications
- Confirmation on assignment
- 24-hour reminder before task
- Manual messages from organizers

✅ Admin Features
- Assignment overview
- Highlight unfilled roles
- Export to CSV

---

## 🌐 Endpoints Summary

### Public Routes
```
POST   /api/auth/register     - Register new volunteer
POST   /api/auth/login        - Login
```

### Protected Routes (Volunteers)
```
GET    /api/auth/profile      - Get profile
PUT    /api/auth/profile      - Update profile
GET    /api/events            - List events
GET    /api/assignments/my-assignments  - My tasks
GET    /api/assignments/available/:eventId - Browse tasks
POST   /api/events/:eventId/tasks/:taskId/signup - Sign up
```

### Protected Routes (Organizers Only)
```
POST   /api/events                      - Create event
POST   /api/events/:eventId/sessions    - Add session
POST   /api/events/:eventId/tasks       - Add task
POST   /api/assignments/assign          - Assign volunteer
DELETE /api/assignments/:id             - Unassign
GET    /api/assignments/dashboard/:eventId - Dashboard
GET    /api/assignments/export/:eventId    - Export CSV
```

---

## 🆘 Getting Help

### Common Issues

**"Connection refused on localhost:5000"**
- Backend not running? Run `npm run dev` in backend folder
- Port in use? Run `lsof -i :5000` and kill the process

**"Connection refused on database"**
- PostgreSQL not running? Start it with `brew services start postgresql`
- Database not created? Run `npm run db:setup`

**"CORS errors in browser"**
- Check `.env` FRONTEND_URL matches your frontend URL
- Restart backend after changing `.env`

**More help?**
- See troubleshooting section in [SETUP.md](SETUP.md)
- Check specific documentation for your component
- Review error messages in browser console and backend terminal

---

## 📚 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [TypeScript Docs](https://www.typescriptlang.org/)

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────────┐
│          React Frontend (Port 3000)         │
│  ┌─────────────────────────────────────┐   │
│  │ Pages: Login, Dashboard, Setup      │   │
│  │ Services: API Client, useAuth hook  │   │
│  │ Styling: Tailwind CSS               │   │
│  └─────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST (Axios)
               │
┌──────────────▼──────────────────────────────┐
│       Express.js Backend (Port 5000)        │
│  ┌─────────────────────────────────────┐   │
│  │ Controllers: Auth, Events, Tasks    │   │
│  │ Services: Email, Assignments        │   │
│  │ Middleware: JWT Auth, Errors        │   │
│  └─────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │ SQL Queries
               │
┌──────────────▼──────────────────────────────┐
│       PostgreSQL Database                   │
│  ┌─────────────────────────────────────┐   │
│  │ Tables: Users, Events, Tasks, etc.  │   │
│  │ Indexes: For performance            │   │
│  │ Constraints: Data integrity         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 📞 Next Steps

1. **Setup** → Follow [SETUP.md](SETUP.md) (15 minutes)
2. **Understand** → Read relevant documentation for your role
3. **Test** → Login with sample accounts from [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
4. **Develop** → Start customizing code
5. **Deploy** → Follow production deployment section in [README.md](README.md)

---

**Questions?** Check the documentation index above or the specific doc for your component.

**Ready?** Start with [SETUP.md](SETUP.md)!
