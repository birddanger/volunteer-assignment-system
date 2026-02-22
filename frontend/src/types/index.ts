export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  swimmer_team?: string;
  is_organizer: boolean;
  created_at: string;
}

export interface Event {
  event_id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface Session {
  session_id: string;
  event_id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export interface Task {
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
  session_name?: string;
  date?: string;
  location?: string;
  assigned_count?: number;
}

export interface Assignment {
  assignment_id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Cancelled';
  title?: string;
  description?: string;
  instructions?: string;
  start_time?: string;
  end_time?: string;
  session_id?: string;
  session_name?: string;
  date?: string;
  event_id?: string;
  event_name?: string;
  location?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'unassignment' | 'reminder' | 'announcement' | 'info';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AssignmentHistoryItem {
  assignment_id: string;
  assigned_at: string;
  status: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  task_id: string;
  session_name: string;
  date: string;
  event_name: string;
  event_id: string;
  location: string;
}

export interface ProfileStats {
  totalAssignments: number;
  totalHours: number;
  totalEvents: number;
}

export interface EventTemplate {
  template_id: string;
  name: string;
  description?: string;
  sessions_count: number;
  tasks_count: number;
  created_at: string;
}

export interface CompetitionEntry {
  entry_id: string;
  event_id: string;
  team_name?: string;
  swimmer_name?: string;
  discipline: string;
  category?: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_end_time?: string;
  pool_location?: string;
  notes?: string;
  created_at: string;
}
