import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import ChatPortalPage from '../pages/ChatPortalPage.jsx';
import HrDashboardPage from '../pages/HrDashboardPage.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA: ACCESO CORPORATIVO */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PROTEGIDAS GENERALES (Colaboradores y RRHH) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPortalPage />} />
        </Route>

        {/* RUTA PROTEGIDA EXCLUSIVA PARA TALENTO HUMANO (rol === 'rrhh') */}
        <Route element={<ProtectedRoute allowedRoles={['rrhh']} />}>
          <Route path="/dashboard" element={<HrDashboardPage />} />
        </Route>

        {/* COMODÍN: REDIRECCIÓN INTELIGENTE */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
