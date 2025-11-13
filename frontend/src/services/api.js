import axios from 'axios';

const api = axios.create({
  // Voltando para localhost, pois os dois servidores rodarão na mesma máquina
  baseURL: 'http://localhost:5000/api', 
});

// ... (o resto do arquivo continua igual)
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