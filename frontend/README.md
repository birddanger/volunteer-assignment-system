# Frontend Documentation

React + TypeScript web interface for the Volunteer Assignment System.

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit with your API URL:

```
VITE_API_URL=http://localhost:5000/api
```

### Development

Start development server with hot reload:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Output in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── VolunteerDashboardPage.tsx
│   ├── AdminDashboardPage.tsx
│   └── EventSetupPage.tsx
├── components/      # Reusable components
├── services/        # API client
│   └── apiClient.ts
├── hooks/           # Custom React hooks
│   └── useAuth.ts
├── types/           # TypeScript types
│   └── index.ts
├── App.tsx          # Main app with routing
├── main.tsx         # Entry point
└── index.css        # Tailwind styles
```

## Pages

### LoginPage
- Email/password login
- Forgot password link
- Navigate to register

### RegisterPage
- User registration form
- First name, last name, email, password
- Phone and swimmer team (optional)
- Link to login

### VolunteerDashboardPage
Shows:
- User's assigned tasks
- Available open tasks
- Self sign-up button for each task
- Task details (time, location, description)

### AdminDashboardPage
Shows:
- Task status overview
- Assignment counts per task
- Export to CSV
- Unfilled roles highlighted

### EventSetupPage
Three tabs:
1. **Events** - Create new event, list existing
2. **Sessions** - Add sessions to event
3. **Tasks** - Add tasks to sessions

## Custom Hooks

### useAuth()

Manages authentication state and operations.

```typescript
const { user, token, isLoading, error, register, login, logout } = useAuth();
```

**Methods:**
- `register(email, password, firstName, lastName, phone?, swimmerTeam?)` - Register new account
- `login(email, password)` - Login user
- `logout()` - Clear auth state

**State:**
- `user` - Current user object or null
- `token` - JWT token or null
- `isLoading` - Request in progress
- `error` - Error message or null

## API Client

Located in `src/services/apiClient.ts`

```typescript
import apiClient from '@/services/apiClient';

// Authentication
await apiClient.login(email, password);
await apiClient.register(email, password, firstName, lastName);
await apiClient.getProfile();
await apiClient.updateProfile(phone, swimmerTeam);

// Events
await apiClient.createEvent(name, startDate, endDate, location);
await apiClient.listEvents();
await apiClient.getEvent(eventId);

// Sessions
await apiClient.createSession(eventId, name, date, startTime, endTime);
await apiClient.listSessions(eventId);

// Tasks
await apiClient.createTask(eventId, sessionId, title, description, startTime, endTime, requiredVolunteers);
await apiClient.listTasks(eventId);
await apiClient.selfSignUpTask(taskId);

// Assignments
await apiClient.getMyAssignments();
await apiClient.getAvailableTasks(eventId);
await apiClient.getAdminDashboard(eventId);
await apiClient.exportCSV(eventId);
```

## Types

```typescript
interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  swimmer_team?: string;
  is_organizer: boolean;
  created_at: string;
}

interface Event {
  event_id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  created_by: string;
}

interface Task {
  task_id: string;
  session_id: string;
  event_id: string;
  title: string;
  description: string;
  instructions?: string;
  start_time: string;
  end_time: string;
  required_volunteers: number;
  status: 'Open' | 'Partially Filled' | 'Filled';
}

interface Assignment {
  assignment_id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Cancelled';
  title?: string;
  start_time?: string;
  end_time?: string;
  session_name?: string;
  date?: string;
  event_location?: string;
}
```

## Routing

Protected routes require authentication via `<ProtectedRoute>` wrapper:

```
/login                  → LoginPage
/register               → RegisterPage
/dashboard              → VolunteerDashboardPage (protected)
/setup                  → EventSetupPage (protected, organizers only)
/admin                  → AdminDashboardPage (protected, organizers only)
/                       → Redirects to /dashboard
```

## Styling

### Tailwind CSS Setup

Configuration in `tailwind.config.js`:
- Custom color palette
- Extended theme
- Responsive breakpoints

### Custom CSS Classes

In `src/index.css`:
- `.container` - Max width layout
- `.card` - White card with shadow
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button styles
- `.input` - Form input styling
- `.form-group` - Form wrapper
- `.label` - Form label

Usage:
```jsx
<div className="container">
  <div className="card">
    <form className="form-group">
      <label className="label">Email</label>
      <input className="input" type="email" />
      <button className="btn-primary">Submit</button>
    </form>
  </div>
</div>
```

## Error Handling

API errors are caught and displayed:

```typescript
try {
  await apiClient.login(email, password);
} catch (error: any) {
  const message = error.response?.data?.error || 'Login failed';
  setError(message);
}
```

## Authentication Flow

1. User registers or logs in
2. JWT token received and stored in localStorage
3. Token automatically added to API requests
4. Token validated on protected routes
5. Logout clears token and auth state
6. Expired token returns 401 and redirects to login

## Development Tips

### Hot Module Reload
Changes to React components automatically refresh in browser.

### TypeScript Errors
Run type checker:
```bash
npm run typecheck
```

### Build Optimization
Vite automatically:
- Code splits by route
- Tree-shakes unused code
- Minifies production builds
- Pre-bundles dependencies

### Environment Variables
Prefix with `VITE_` to be available in app:
```env
VITE_API_URL=...
VITE_APP_NAME=...
```

Access via:
```typescript
import.meta.env.VITE_API_URL
```

## Deployment

### Vercel
```bash
npm run build
# Push to GitHub, Vercel auto-deploys
```

### Netlify
```bash
npm run build
# Drag `dist/` folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Code splitting by route
- Lazy loading components
- Image optimization
- CSS-in-JS (Tailwind) purging

## Accessibility

- Semantic HTML
- Form labels with inputs
- ARIA attributes where needed
- Keyboard navigation support
- Color contrast compliance

## Testing

To add tests, install testing library:

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

Create test files as `*.test.tsx` and run:

```bash
npm run test
```
