import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL base da sua API
});

// Interceptor para adicionar o token a todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;