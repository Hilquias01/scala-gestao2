import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Importações dos componentes e páginas
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import VehicleListPage from "./pages/VehicleListPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import EmployeeListPage from "./pages/EmployeeListPage";
import EmployeeSalariesPage from "./pages/EmployeeSalariesPage";
import GeneralExpensesPage from "./pages/GeneralExpensesPage";
import RevenuesPage from './pages/RevenuesPage';
import ReportsPage from './pages/ReportsPage'; // <-- Importação que faltava

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas - Apenas Login e Cadastro */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rotas Privadas Agrupadas sob o Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/fleet" element={<VehicleListPage />} />
            <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
            <Route path="/personnel" element={<EmployeeListPage />} />
            <Route path="/salaries" element={<EmployeeSalariesPage />} />
            <Route path="/expenses" element={<GeneralExpensesPage />} />
            <Route path="/revenues" element={<RevenuesPage />} />
            <Route path="/reports" element={<ReportsPage />} /> {/* <-- Rota que faltava */}
          </Route>

          {/* Rota padrão leva para o dashboard (se logado) ou login (se não logado) */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
