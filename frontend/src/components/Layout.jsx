import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main>
        {/* O Outlet renderiza o componente da rota filha aqui */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;