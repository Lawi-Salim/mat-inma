// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import MenuManagement from './components/admin/MenuManagement';
import OrdersManagement from './components/admin/OrdersManagement';
import StatsDashboard from './components/admin/StatsDashboard';
import AdminEmployees from './components/admin/AdminEmployees';
import EmployeLayout from './components/employe/EmployeLayout';
import KitchenOrders from './components/employe/KitchenOrders';
import CashierDashboard from './components/employe/CashierDashboard';
import ClientLayout from './components/client/ClientLayout';
import ClientOrders from './components/client/ClientOrders';
import ClientFavorites from './components/client/ClientFavorites';
import ClientMenu from './components/client/ClientMenu';
import ClientPayments from './components/client/ClientPayments';
import ClientParametres from './components/client/ClientParametres';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="stats" element={<StatsDashboard />} />
        <Route path="employes" element={<AdminEmployees />} />
      </Route>

      <Route path="/employe" element={<EmployeLayout />}>
        <Route path="commandes" element={<KitchenOrders />} />
        <Route path="caisse" element={<CashierDashboard />} />
      </Route>

      <Route path="/client" element={<ClientLayout />}>
        <Route path="menu" element={<ClientMenu />} />
        <Route path="commandes" element={<ClientOrders />} />
        <Route path="favoris" element={<ClientFavorites />} />
        <Route path="paiements" element={<ClientPayments />} />
        <Route path="parametres" element={<ClientParametres />} />
      </Route>

    </Routes>
  );
}

export default App;