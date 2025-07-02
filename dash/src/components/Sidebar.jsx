import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/books', label: 'Inventory' },
    { to: '/admin/orders', label: 'Sales' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/suppliers', label: 'Suppliers' },
    { to: '/admin/others', label: 'Other Businesses' }, // already present
  ];

  return (
    <aside className="h-screen w-64 bg-white/60 backdrop-blur-md border-r-2 border-red-200 shadow-md font-lora sticky top-0 z-40 flex flex-col">
      <div className="flex items-center h-16 px-6 border-b-2 border-red-200">
        <img src="/nbs.svg" alt="NBS Logo" className="h-10 w-10 mr-2" />
        <span className="text-xl font-bold text-red-700">Control Panel</span>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`block px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
              (location.pathname === link.to ||
                (link.to === '/admin' && location.pathname === '/admin/')) // Highlight Dashboard for both /admin and /admin/
                ? 'bg-red-100 text-red-900'
                : 'text-black hover:bg-red-50 hover:text-red-900'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 pb-6 mt-auto flex flex-col gap-2">
        <Link
          to="/dashboard"
          className="block px-4 py-2 rounded-lg font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200"
        >
          ← Back to Dashboard
        </Link>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="block w-full px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
