export interface User {
  user_id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  swimmer_team?: string;
  is_organizer: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
}

export interface Session {
  session_id: string;
  event_id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  assignment_id: string;
  task_id: string;
  user_id: string;
  assigned_by?: string;
  assigned_at: string;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Cancelled';
}

export interface Notification {
  notification_id: string;
  user_id: string;
  assignment_id?: string;
  type: 'Confirmation' | 'Reminder' | 'Manual';
  sent_at?: string;
  status: 'Sent' | 'Failed' | 'Bounced';
  created_at: string;
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

export interface JWTPayload {
  user_id: string;
  email: string;
  is_organizer: boolean;
}

export interface AuthenticatedRequest {
  user?: JWTPayload;
}
