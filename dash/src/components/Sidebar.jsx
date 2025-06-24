import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Example links for admin control panel
  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/books', label: 'Books' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/users', label: 'Users' },
    // Add more links as needed
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
              location.pathname === link.to
                ? 'bg-red-100 text-red-900'
                : 'text-black hover:bg-red-50 hover:text-red-900'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
