// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; // <-- import Sidebar
import { useAuth } from './context/AuthContext';
import Users from './pages/Users';
import Books from './pages/Books'; // <-- import Books
import Orders from './pages/Orders'; // <-- import Orders
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import SalesDashboard from './pages/SalesDashboard'; // <-- import SalesDashboard

function AdminLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'customer']}>
            <>
              <Navbar />
              <DashboardPage />
            </>
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <>
            <Navbar />
            <Products />
          </>
        } />
        {/* Admin routes: show Sidebar, hide Navbar */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <Routes>
                <Route path="" element={<div className="p-8">Admin Control Panel Content</div>} />
                <Route path="users" element={<Users />} />
                <Route path="books" element={<Books />} />
                <Route path="orders" element={<Orders />} />
                {/* Add more admin routes here */}
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
