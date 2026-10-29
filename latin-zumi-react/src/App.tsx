import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { GOOGLE_AUTH_ENABLED } from './config/features';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import Home from './pages/Home';
import About from './pages/About';
import CompleteProfile from './pages/CompleteProfile';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Solo los usuarios de Google llegan sin país; el registro normal ya lo pide */}
        {GOOGLE_AUTH_ENABLED && (
          <Route path="/completar-perfil" element={<CompleteProfile />} />
        )}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/historial" element={<TransactionHistory />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}