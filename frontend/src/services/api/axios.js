import axios from 'axios';
import { setUser, clearUser, getUser } from '../../utils/auth';
import { createAbility, clearAbility, setAbility } from '../../utils/ability';

const API_URL = 'http://localhost:5000/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearUser();
      clearAbility();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.success) {
      setUser(response.data.data.user);
      setAbility(response.data.data.ability?.rules || []);
    }
    return response;
  },
  register: (userData) => api.post('/register', userData),
  logout: async () => {
    const response = await api.post('/logout');
    clearUser();
    clearAbility();
    return response;
  }
};

// Bug API
export const bugAPI = {
  getAll: () => api.get('/bugs'),
  getOne: (id) => api.get(`/bugs/${id}`),
  create: (data) => api.post('/bugs/create', data),
  update: (id, data) => api.put(`/bugs/${id}`, data),
  assign: (id, data) => api.put(`/bugs/${id}/assign`, data),
  delete: (id) => api.delete(`/bugs/${id}`),
};

// ✅ User API — for fetching developers dropdown etc.
export const userAPI = {
  getDevelopers: () => api.get('/bugs/developers'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;