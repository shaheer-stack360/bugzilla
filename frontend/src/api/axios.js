import axios from "axios";
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: "http://localhost:5000/",
  withCredentials: true
});


api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear cookies on 401
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/*api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🔍 Axios Error Interceptor Triggered:', {
      status: error.response?.status,
      url: error.config?.url,
      path: window.location.pathname,
      message: error.response?.data?.message
    });
    
    // ONLY log, don't redirect for now
    if (error.response?.status === 401) {
      console.log('⚠️ 401 Unauthorized - NOT redirecting (debug mode)');
      // Don't redirect during debugging
    }
    
    return Promise.reject(error);
  }
);*/
export default api;