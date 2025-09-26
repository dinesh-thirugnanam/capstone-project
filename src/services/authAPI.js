// Re-export from main API service to maintain compatibility
import ApiService from './api';

// Auth-specific API methods
export const authAPI = {
  login: (email, password) => ApiService.login(email, password),
  register: (email, password, role) => ApiService.register(email, password, role),
  getProfile: () => ApiService.getProfile(),
  refreshToken: () => ApiService.refreshToken(),
};

export default authAPI;
