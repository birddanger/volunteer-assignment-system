# Setup & Installation Guide

Complete step-by-step instructions for setting up the Volunteer Assignment System for development or deployment.

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** 18.0 or higher ([download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **PostgreSQL** 12 or higher ([download](https://www.postgresql.org/download/))
- **Git** (optional, for cloning repository)

### Verify Installations

```bash
node --version    # Should be 18.0+
npm --version     # Should be 9.0+
psql --version    # Should be 12.0+
```

---

## Part 1: Database Setup

### Step 1.1: Create PostgreSQL User and Database

**macOS/Linux using psql:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql prompt, create database and user
CREATE DATABASE volunteer_system;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE volunteer_system TO postgres;
\q
```

**Windows:**
1. Open pgAdmin (comes with PostgreSQL)
2. Right-click "Databases" → Create → Database
3. Name: `volunteer_system`
4. Right-click "Login/Group Roles" → Create → Role
5. Name: `postgres`, Password: `postgres`
6. Grant privileges to role

### Step 1.2: Verify Database Connection

```bash
psql -U postgres -d volunteer_system -h localhost
\dt  # List tables (should be empty)
\q   # Quit
```

---

## Part 2: Backend Setup

### Step 2.1: Navigate to Backend Directory

```bash
cd volunteer-assignment-system/backend
```

### Step 2.2: Install Dependencies

```bash
npm install
```

This installs:
- Express.js (web server)
- PostgreSQL client
- JWT for authentication
- Nodemailer for emails
- TypeScript compiler
- Development tools (Nodemon, tsx)

### Step 2.3: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your settings. For local development, the defaults work:

```
NODE_ENV=development
PORT=5000

# Database (default PostgreSQL settings)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteer_system
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRY=7d

# Email (optional for development, use any test service)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@volunteerapp.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**For Gmail emails:**
1. Enable 2-factor authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the generated password in `EMAIL_PASSWORD`

**For development without emails:**
- Leave EMAIL_* blank
- The system will log email attempts to console instead

### Step 2.4: Initialize Database

**Setup tables and schema:**

```bash
npm run db:setup
```

Output:
```
Setting up database...
Database setup complete!
```

**Seed sample data:**

```bash
npm run db:seed
```

Output:
```
Seeding database...
Database seeding complete!
```

This creates:
- 1 admin organizer account
- 5 volunteer test accounts
- 1 sample event with sessions and tasks
- Sample assignments

### Step 2.5: Start Backend Server

```bash
npm run dev
```

Expected output:
```
🚀 Server running on http://localhost:5000
📊 Database: volunteer_system
🌐 Frontend: http://localhost:3000
```

**Server is now running!** Leave this terminal open.

### Step 2.6: Test Backend (Optional)

In a new terminal:

```bash
# Test health check
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

---

## Part 3: Frontend Setup

### Step 3.1: Open New Terminal and Navigate to Frontend

```bash
cd volunteer-assignment-system/frontend
```

### Step 3.2: Install Dependencies

```bash
npm install
```

This installs:
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Vite as build tool
- Development tools

### Step 3.3: Create Environment File

```bash
cp .env.example .env
```

Default settings should work for local development:

```
VITE_API_URL=http://localhost:5000/api
```

### Step 3.4: Start Frontend Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.8 ready in 345 ms

  ➜  Local:   http://localhost:3000
  ➜  press h to show help
```

---

## Part 4: Access the Application

### Open in Browser

Navigate to: **http://localhost:3000**

### Test Accounts

After seeding, these accounts are available:

#### Organizer Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Access:** Event setup, admin dashboard, manual assignments

#### Volunteer Accounts
- **Email:** `volunteer1@example.com` through `volunteer5@example.com`
- **Password:** `volunteer1` through `volunteer5`
- **Access:** Volunteer dashboard, self sign-up

### Test the System

1. **Register as new volunteer:**
   - Click "Register" on login page
   - Fill in details
   - Create account

2. **Login as organizer:**
   - Login with `admin@example.com` / `admin123`
   - Navigate to "Setup" to create event
   - Navigate to "Dashboard" to see assignments

3. **Login as volunteer:**
   - Login with `volunteer1@example.com` / `volunteer1`
   - View assigned tasks
   - Browse and sign up for available tasks

---

## Part 5: Common Tasks

### View Database Tables

```bash
psql -U postgres -d volunteer_system

# List tables
\dt

# View users
SELECT user_id, email, is_organizer FROM users;

# View tasks
SELECT task_id, title, status FROM tasks;

\q
```

### Reset Database

**Delete all data and recreate schema:**

```bash
cd backend

# Drop and recreate database
psql -U postgres -c "DROP DATABASE volunteer_system;"
psql -U postgres -c "CREATE DATABASE volunteer_system;"

# Setup fresh schema
npm run db:setup

# Seed sample data
npm run db:seed
```

### Check Backend Logs

Open backend terminal to see:
- SQL queries executed
- HTTP requests and responses
- Email sending attempts
- Error messages

### Clear Frontend Cache

If frontend shows old data:

```bash
# Clear browser cache
# In Chrome DevTools: Application → Clear site data

# Or force reload in browser
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)
```

### Rebuild TypeScript

```bash
cd backend
npm run typecheck
npm run build
```

```bash
cd frontend
npm run typecheck
npm run build
```

---

## Part 6: Development Workflow

### Making Changes

**Backend changes:**
1. Edit files in `backend/src/`
2. Server auto-restarts with Nodemon
3. Browser may show error if API unavailable briefly

**Frontend changes:**
1. Edit files in `frontend/src/`
2. Browser auto-refreshes with Hot Module Reload
3. Changes appear immediately

### Adding New Database Table

1. Create migration SQL in `backend/src/db/setup.ts`
2. Run `npm run db:setup` in backend
3. Seed if needed with `npm run db:seed`

### Adding New API Endpoint

1. Create controller in `backend/src/controllers/`
2. Create route in `backend/src/routes/`
3. Register route in `backend/src/index.ts`
4. Test with curl or Postman

### Adding New Frontend Page

1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in Navigation component

---

## Part 7: Troubleshooting

### "Connection refused" on localhost:5000

- Is backend running? Check terminal for `🚀 Server running`
- Is port 5000 in use? 
  ```bash
  lsof -i :5000  # Find process
  kill -9 <PID>  # Kill process
  ```

### "Connection refused" on database

- Is PostgreSQL running?
  ```bash
  # macOS
  brew services list
  brew services start postgresql
  
  # Linux
  sudo systemctl start postgresql
  
  # Windows
  # Check Services app or pgAdmin
  ```

- Can you connect to database?
  ```bash
  psql -U postgres -d volunteer_system
  ```

### CORS errors in browser console

- Backend CORS is set to `FRONTEND_URL` in `.env`
- Ensure `FRONTEND_URL=http://localhost:3000`
- Restart backend after changing `.env`

### Email not sending

- Check `.env` EMAIL_* settings
- Gmail requires app-specific password
- Outlook/Hotmail may need different configuration
- For development, emails print to console

### Frontend shows 404 on refresh

- Vite needs `index.html` to redirect routes
- This is configured automatically
- Check dev server is running on port 3000

### Type errors in TypeScript

```bash
# Check for type errors without building
npm run typecheck

# Fix common issues
npm install  # Reinstall types
```

### Database permission errors

```bash
# Ensure user has privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE volunteer_system TO postgres;"
```

---

## Part 8: Production Deployment

### Backend Deployment (Heroku Example)

1. Create Heroku account
2. Install Heroku CLI
3. Build and deploy:
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:hobby-dev
   heroku config:set JWT_SECRET=your-prod-secret
   git push heroku main
   ```

### Frontend Deployment (Vercel Example)

1. Create Vercel account
2. Connect GitHub repository
3. Set `VITE_API_URL` to production backend
4. Vercel auto-deploys on push

### Environment Variables for Production

**Backend:**
- Change `JWT_SECRET` to strong random value
- Use production email service (SendGrid, AWS SES)
- Set `NODE_ENV=production`
- Use managed PostgreSQL service

**Frontend:**
- Set `VITE_API_URL` to production backend domain
- Remove any dev-only code

---

## Next Steps

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 3000
3. ✅ Database initialized with sample data
4. ✅ Ready to develop!

**Read:**
- [Backend API Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [MVP Specification](MVP_SPECIFICATION.md)

**Start customizing:**
- Modify event setup flow
- Customize email templates
- Add more validation rules
- Extend database schema
- Enhance UI/UX

---

## Need Help?

Check these resources:
- Express.js: https://expressjs.com/
- React: https://react.dev/
- React Router: https://reactrouter.com/
- Tailwind CSS: https://tailwindcss.com/
- PostgreSQL: https://www.postgresql.org/docs/

Happy coding! 🚀
