// src/pages/DashboardPage.jsx
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // Or use React Router's navigate()
  };

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Role: {user.role}</p>

      {user.role === 'admin' && (
        <div>
          <h2>Admin Controls</h2>
          <button onClick={() => alert('Add book form here')}>Add New Book</button>
          <button onClick={() => alert('Manage Orders here')}>Manage Orders</button>
          <button onClick={() => alert('View Users here')}>View Users</button>
        </div>
      )}

      {user.role === 'customer' && (
        <div>
          <h2>Your Account</h2>
          <button onClick={() => alert('View your orders here')}>My Orders</button>
          <button onClick={() => alert('Go to Bookstore')}>Browse Books</button>
        </div>
      )}

      <br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default DashboardPage;
