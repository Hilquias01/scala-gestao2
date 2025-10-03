// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // 1. Importe o useCallback
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 2. Envolvemos a função logout com useCallback
  // Ela só será recriada se a dependência 'navigate' mudar.
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const loadUserFromToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/user');
          setUser(data);
        } catch (error) {
          console.error("Sessão inválida, fazendo logout.", error);
          logout(); // Agora é seguro usar o logout aqui
        }
      }
      setLoading(false);
    };
    loadUserFromToken();
  }, [logout]); // 3. Adicionamos 'logout' ao array de dependências

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Falha no login', error.response.data);
      throw error;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Desabilitamos a regra do linter para a linha seguinte
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};