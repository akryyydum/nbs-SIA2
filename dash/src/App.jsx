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
import SupplierDashboard from './pages/SupplierDashboard'; // <-- import SupplierDashboard
import Checkout from './pages/Checkout'; // <-- import Checkout
import Order from './pages/Order';
import AdminDashboard from './pages/AdminDashboard'; // <-- import AdminDashboard
import SupplierBooks from './pages/Supplier'; // <-- import SupplierBooks
import About from './pages/About'; // <-- import About
import Contact from './pages/Contact'; // <-- import Contact


function AdminLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          <Route index element={<AdminDashboard />} /> {/* Show AdminDashboard for /admin or /admin/ */}
          <Route path="users" element={<Users />} />
          <Route path="books" element={<Books />} />
          <Route path="orders" element={<Orders />} />
          <Route path="suppliers" element={<SupplierDashboard />} />
          {/* Add more admin routes here */}
        </Routes>
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
        <Route path="/checkout" element={
          <>
            <Navbar />
            <Checkout />
          </>
        } />
        <Route path="/orders" element={
          user?.role === 'admin' ? (
            <>
              <Navbar />
              <Orders />
            </>
          ) : (
            <>
              <Navbar />
              <Order />
            </>
          )
        } />
        <Route path="/sales-dashboard" element={
          <ProtectedRoute allowedRoles={['sales department']}>
            <>
              <Navbar />
              <SalesDashboard />
            </>
          </ProtectedRoute>
        } />
        {/* Admin routes: show Sidebar, hide Navbar */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        } />
        <Route path="/supplier-dashboard" element={
          <ProtectedRoute allowedRoles={['supplier department', 'supplier', 'Supplier Department']}>
            <>
              <Navbar />
              <SupplierBooks />
            </>
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['inventory department']}>
            <>
              <Navbar />
              <Inventory />
            </>
          </ProtectedRoute>
        } />
        <Route path="/about" element={<About />} /> {/* Add About route */}
        <Route path="/contact" element={<Contact />} /> {/* Add Contact route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
