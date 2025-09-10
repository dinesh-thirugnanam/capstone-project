import { API_CONFIG } from '../utils/constants';
import { tokenManager, withRetry, handleAPIError } from '../utils/helpers';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  async getAuthHeaders() {
    const token = await tokenManager.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const config = {
      headers,
      timeout: this.timeout,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error - ${endpoint}:`, error);
      throw new Error(handleAPIError(error));
    }
  }

  // Authentication endpoints
  async register(email, password, role = 'employee') {
    return withRetry(() =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      })
    );
  }

  async login(email, password) {
    return withRetry(() =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    );
  }

  async getProfile() {
    return withRetry(() =>
      this.request('/auth/me')
    );
  }

  async refreshToken() {
    return withRetry(() =>
      this.request('/auth/refresh', {
        method: 'POST',
      })
    );
  }

  // Geofence (Office) endpoints
  async getGeofences() {
    return withRetry(() =>
      this.request('/geofences')
    );
  }

  async createGeofence(geofenceData) {
    return withRetry(() =>
      this.request('/geofences', {
        method: 'POST',
        body: JSON.stringify(geofenceData),
      })
    );
  }

  async updateGeofence(id, geofenceData) {
    return withRetry(() =>
      this.request(`/geofences/${id}`, {
        method: 'PUT',
        body: JSON.stringify(geofenceData),
      })
    );
  }

  async deleteGeofence(id) {
    return withRetry(() =>
      this.request(`/geofences/${id}`, {
        method: 'DELETE',
      })
    );
  }

  // Attendance endpoints
  async recordAttendanceEvent(eventData) {
    return withRetry(() =>
      this.request('/attendance/event', {
        method: 'POST',
        body: JSON.stringify(eventData),
      })
    );
  }

  async getAttendanceHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/attendance/history${queryString ? `?${queryString}` : ''}`;
    
    return withRetry(() =>
      this.request(endpoint)
    );
  }

  async getCurrentStatus() {
    return withRetry(() =>
      this.request('/attendance/status')
    );
  }

  async getDailySummary(date) {
    return withRetry(() =>
      this.request(`/attendance/summary/${date}`)
    );
  }

  async getWeeklySummary(startDate, endDate) {
    return withRetry(() =>
      this.request(`/attendance/summary/range?start=${startDate}&end=${endDate}`)
    );
  }

  // Admin endpoints
  async getAllEmployees() {
    return withRetry(() =>
      this.request('/admin/employees')
    );
  }

  async getEmployeeAttendance(employeeId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/employees/${employeeId}/attendance${queryString ? `?${queryString}` : ''}`;
    
    return withRetry(() =>
      this.request(endpoint)
    );
  }

  async getAttendanceReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports${queryString ? `?${queryString}` : ''}`;
    
    return withRetry(() =>
      this.request(endpoint)
    );
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export default new ApiService();
