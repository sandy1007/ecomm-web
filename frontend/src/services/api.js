import axios from 'axios';
import bugsnagManager from '../utils/bugsnag.jsx';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config._startTime = Date.now();
  return config;
});

api.interceptors.response.use(
  (res) => {
    const duration = res.config._startTime ? Date.now() - res.config._startTime : null;
    const path = res.config.url?.replace(res.config.baseURL || '', '') || res.config.url;
    bugsnagManager.trackAPICall(
      res.config.method?.toUpperCase() || 'GET',
      path,
      null,
      res.status,
      duration
    );
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const duration = err.config?._startTime ? Date.now() - err.config._startTime : null;
    const path = err.config?.url?.replace(err.config?.baseURL || '', '') || err.config?.url || 'unknown';
    bugsnagManager.trackAPICall(
      err.config?.method?.toUpperCase() || 'GET',
      path,
      null,
      err.response?.status || 'network_error',
      duration
    );
    return Promise.reject(err);
  }
);

export default api;
