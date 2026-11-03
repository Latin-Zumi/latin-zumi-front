import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { ADMIN_ENABLED, GOOGLE_AUTH_ENABLED } from './config/features';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import Home from './pages/Home';
import About from './pages/About';
import CompleteProfile from './pages/CompleteProfile';
import Login from './pages/Login';
import PasswordRecovery from './pages/PasswordRecovery';
import Register from './pages/Register';
import AdminOverview from './pages/admin/AdminOverview';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<PasswordRecovery />} />
        <Route path="/register" element={<Register />} />
        {/* Solo los usuarios de Google llegan sin país; el registro normal ya lo pide */}
        {GOOGLE_AUTH_ENABLED && (
          <Route path="/completar-perfil" element={<CompleteProfile />} />
        )}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/historial" element={<TransactionHistory />} />
        </Route>
        {ADMIN_ENABLED && (
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="parametros" element={<AdminSettings />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="usuarios/:id" element={<AdminUserDetail />} />
            </Route>
          </Route>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}