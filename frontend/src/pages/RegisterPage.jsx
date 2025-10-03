import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess('Cadastro realizado com sucesso! Você será redirecionado para o login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao tentar se cadastrar.');
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Cadastro - Scala Gestão</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nome Completo</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p style={{ color: 'var(--verde-sucesso)', textAlign: 'center' }}>{success}</p>}
        <button type="submit" className="btn">Cadastrar</button>
      </form>
      <p className="auth-link">
        Já tem uma conta? <Link to="/login">Faça Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;