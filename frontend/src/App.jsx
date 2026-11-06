import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Brands from './pages/Brands';
import Models from './pages/Models';
import ModelDetail from './pages/ModelDetail';
import Components from './pages/Components';
import ComponentDetail from './pages/ComponentDetail';
import Suppliers from './pages/Suppliers';
import SourcingMatrix from './pages/SourcingMatrix';
import CostOptimizer from './pages/CostOptimizer';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import RecordSale from './pages/RecordSale';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import DBExplorer from './pages/DBExplorer';
import AuditLog from './pages/AuditLog';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
        Connecting to Mobile Manufacturing System...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="brands" element={<Brands />} />
                <Route path="models" element={<Models />} />
                <Route path="models/:modelId" element={<ModelDetail />} />
                <Route path="components" element={<Components />} />
                <Route path="components/:componentId" element={<ComponentDetail />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="sourcing-matrix" element={<SourcingMatrix />} />
                <Route path="cost-optimizer" element={<CostOptimizer />} />
                <Route path="batches" element={<Batches />} />
                <Route path="batches/:batchId" element={<BatchDetail />} />
                <Route path="record-sale" element={<RecordSale />} />
                <Route path="sales-history" element={<SalesHistory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="inventory" element={<Reports />} />
                <Route path="db-explorer" element={<DBExplorer />} />
                <Route path="audit-log" element={<AuditLog />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
