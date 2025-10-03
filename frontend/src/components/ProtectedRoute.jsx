import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Pode adicionar um componente de Spinner/Loading aqui
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    // Redireciona para a página de login, guardando a página que o usuário tentou acessar
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;