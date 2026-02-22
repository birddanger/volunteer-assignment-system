import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // send httpOnly cookies
    });

    // Add token to requests (fallback for localStorage token)
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth endpoints
  async register(email: string, password: string, firstName: string, lastName: string, phone?: string, swimmerTeam?: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      swimmer_team: swimmerTeam,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async updateProfile(phone?: string, swimmerTeam?: string) {
    const response = await this.client.put('/auth/profile', {
      phone,
      swimmer_team: swimmerTeam,
    });
    return response.data;
  }

  // Event endpoints
  async createEvent(name: string, startDate: string, endDate: string, location: string, description?: string) {
    const response = await this.client.post('/events', {
      name,
      start_date: startDate,
      end_date: endDate,
      location,
      description,
    });
    return response.data;
  }

  async getEvent(eventId: string) {
    const response = await this.client.get(`/events/${eventId}`);
    return response.data;
  }

  async listEvents() {
    const response = await this.client.get('/events');
    return response.data;
  }

  // Session endpoints
  async createSession(eventId: string, name: string, date: string, startTime: string, endTime: string, location?: string) {
    const response = await this.client.post(`/events/${eventId}/sessions`, {
      name,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
    });
    return response.data;
  }

  async listSessions(eventId: string) {
    const response = await this.client.get(`/events/${eventId}/sessions`);
    return response.data;
  }

  // Task endpoints
  async createTask(eventId: string, sessionId: string, title: string, description: string, startTime: string, endTime: string, requiredVolunteers: number, instructions?: string) {
    const response = await this.client.post(`/events/${eventId}/tasks`, {
      session_id: sessionId,
      title,
      description,
      instructions,
      start_time: startTime,
      end_time: endTime,
      required_volunteers: requiredVolunteers,
    });
    return response.data;
  }

  async listTasks(eventId: string) {
    const response = await this.client.get(`/events/${eventId}/tasks`);
    return response.data;
  }

  async getTask(eventId: string, taskId: string) {
    const response = await this.client.get(`/events/${eventId}/tasks/${taskId}`);
    return response.data;
  }

  async selfSignUpTask(eventId: string, taskId: string) {
    const response = await this.client.post(`/events/${eventId}/tasks/${taskId}/signup`);
    return response.data;
  }

  // Assignment endpoints
  async manualAssign(taskId: string, volunteerId: string, force?: boolean) {
    const response = await this.client.post('/assignments/assign', {
      taskId,
      volunteerId,
      force,
    });
    return response.data;
  }

  async unassign(assignmentId: string) {
    const response = await this.client.delete(`/assignments/${assignmentId}`);
    return response.data;
  }

  async getMyAssignments() {
    const response = await this.client.get('/assignments/my-assignments');
    return response.data;
  }

  async cancelMyAssignment(assignmentId: string) {
    const response = await this.client.delete(`/assignments/my-assignments/${assignmentId}`);
    return response.data;
  }

  async getAvailableTasks(eventId: string) {
    const response = await this.client.get(`/assignments/available/${eventId}`);
    return response.data;
  }

  async getAdminDashboard(eventId: string) {
    const response = await this.client.get(`/assignments/dashboard/${eventId}`);
    return response.data;
  }

  async getVolunteers() {
    const response = await this.client.get('/assignments/volunteers');
    return response.data;
  }

  async getTaskAssignments(eventId: string) {
    const response = await this.client.get(`/assignments/task-assignments/${eventId}`);
    return response.data;
  }

  async exportCSV(eventId: string) {
    const response = await this.client.get(`/assignments/export/${eventId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // --- Notifications ---
  async getNotifications(limit = 50, offset = 0) {
    const response = await this.client.get('/notifications', {
      params: { limit, offset },
    });
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.client.delete(`/notifications/${id}`);
    return response.data;
  }

  // --- Profile ---
  async getAssignmentHistory() {
    const response = await this.client.get('/auth/profile/history');
    return response.data;
  }

  // --- Templates ---
  async listTemplates() {
    const response = await this.client.get('/templates');
    return response.data;
  }

  async getTemplate(templateId: string) {
    const response = await this.client.get(`/templates/${templateId}`);
    return response.data;
  }

  async saveEventAsTemplate(eventId: string, name: string, description?: string) {
    const response = await this.client.post(`/templates/from-event/${eventId}`, {
      name,
      description,
    });
    return response.data;
  }

  async createEventFromTemplate(templateId: string, name: string, startDate: string, location: string) {
    const response = await this.client.post(`/templates/${templateId}/create-event`, {
      name,
      start_date: startDate,
      location,
    });
    return response.data;
  }

  async deleteTemplate(templateId: string) {
    const response = await this.client.delete(`/templates/${templateId}`);
    return response.data;
  }

  // --- Competition Schedule ---
  async listCompetitionEntries(eventId: string, params?: { date?: string; team?: string; search?: string }) {
    const response = await this.client.get(`/events/${eventId}/competition`, { params });
    return response.data;
  }

  async createCompetitionEntry(eventId: string, entry: {
    team_name?: string; swimmer_name?: string; discipline: string; category?: string;
    scheduled_date: string; scheduled_time: string; estimated_end_time?: string;
    pool_location?: string; notes?: string;
  }) {
    const response = await this.client.post(`/events/${eventId}/competition`, entry);
    return response.data;
  }

  async bulkCreateCompetitionEntries(eventId: string, entries: Array<{
    team_name?: string; swimmer_name?: string; discipline: string; category?: string;
    scheduled_date: string; scheduled_time: string; estimated_end_time?: string;
    pool_location?: string; notes?: string;
  }>) {
    const response = await this.client.post(`/events/${eventId}/competition/bulk`, { entries });
    return response.data;
  }

  async updateCompetitionEntry(eventId: string, entryId: string, entry: {
    team_name?: string; swimmer_name?: string; discipline: string; category?: string;
    scheduled_date: string; scheduled_time: string; estimated_end_time?: string;
    pool_location?: string; notes?: string;
  }) {
    const response = await this.client.put(`/events/${eventId}/competition/${entryId}`, entry);
    return response.data;
  }

  async deleteCompetitionEntry(eventId: string, entryId: string) {
    const response = await this.client.delete(`/events/${eventId}/competition/${entryId}`);
    return response.data;
  }

  async importCompetitionCSV(eventId: string, csv: string) {
    const response = await this.client.post(`/events/${eventId}/competition/import-csv`, { csv });
    return response.data;
  }

  async listCompetitionTeams(eventId: string) {
    const response = await this.client.get(`/events/${eventId}/competition/teams`);
    return response.data;
  }

  async listCompetitionDisciplines(eventId: string) {
    const response = await this.client.get(`/events/${eventId}/competition/disciplines`);
    return response.data;
  }
}

export default new APIClient();
