import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navStyles = {
  navbar: {
    backgroundColor: 'var(--azul-scala)',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontFamily: "'Montserrat', sans-serif",
  },
  navList: {
    listStyle: 'none',
    display: 'flex',
    gap: '1.5rem',
    margin: 0,
    padding: 0,
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '1.5rem 0',
    display: 'inline-block',
    borderBottom: '4px solid transparent',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutButton: {
    background: 'none',
    border: '1px solid white',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  }
};

const Navbar = () => {
  const { user, logout } = useAuth();

  // Estilo para o link ativo
  const activeLinkStyle = {
    borderBottom: '4px solid var(--amarelo-ouro)',
  };

  return (
    <nav style={navStyles.navbar}>
      <Link to="/dashboard" style={navStyles.logo}>Scala Gestão</Link>
      
      {user && (
        <ul style={navStyles.navList}>
          <li>
            <NavLink 
              to="/dashboard" 
              style={({ isActive }) => ({ ...navStyles.navLink, ...(isActive ? activeLinkStyle : {}) })}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/fleet" 
              style={({ isActive }) => ({ ...navStyles.navLink, ...(isActive ? activeLinkStyle : {}) })}
            >
              Frota
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/personnel" 
              style={({ isActive }) => ({ ...navStyles.navLink, ...(isActive ? activeLinkStyle : {}) })}
            >
              Pessoal
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/expenses" 
              style={({ isActive }) => ({ ...navStyles.navLink, ...(isActive ? activeLinkStyle : {}) })}
            >
              Despesas
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/revenues" 
              style={({ isActive }) => ({ ...navStyles.navLink, ...(isActive ? activeLinkStyle : {}) })}
            >
              Receitas
            </NavLink>
          </li>
          {/* ## ADICIONE O NOVO LINK AQUI ## */}
          <li>
            <NavLink 
              to="/reports" 
              style={({ isActive }) => ({ ...navStyles.navLink, ...(isActive ? activeLinkStyle : {}) })}
            >
              Relatórios
            </NavLink>
          </li>
        </ul>
      )}

      {user && (
        <div style={navStyles.userInfo}>
          <span>Olá, {user.name}</span>
          <button style={navStyles.logoutButton} onClick={logout}>Sair</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
