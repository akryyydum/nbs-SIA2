import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; // Add axios import

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const accountRef = useRef();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch cart from backend for the logged-in user
  useEffect(() => {
    if (!user?.token) {
      setCart([]);
      return;
    }
    const fetchCart = async () => {
      try {
        const res = await axios.get(
          (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/cart',
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setCart(res.data.items || []);
      } catch {
        setCart([]);
      }
    };
    fetchCart();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="bg-white/60 backdrop-blur-md border-b-2 border-red-200 shadow-md font-poppins bold sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Search Bar */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <img src="/nbs.svg" alt="NBS Logo" className="h-30 w-30 mr-2" />
            {/* Search Bar (desktop only) */}
            <form className="hidden md:block" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search books..."
                className="px-4 py-2 rounded-lg border border-red-200 shadow focus:outline-none focus:ring-2 focus:ring-red-200 transition w-64"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {/* Only show Home and Contact if not admin */}
            {user?.role !== 'admin' && (
              <>
                <Link to="/dashboard" className="text-black hover:text-red-900 transition-colors duration-200 font-semibold">
                  Home
                </Link>
                <Link to="/contact" className="text-black hover:text-red-900 transition-colors duration-200 font-semibold">
                  Contact
                </Link>
              </>
            )}
            <Link to="/products" className="text-black hover:text-red-900 transition-colors duration-200 font-semibold">
              Products
            </Link>
            <Link to="/about" className="text-black hover:text-red-900 transition-colors duration-200 font-semibold">
              About
            </Link>
            {/* Admin Control Panel Link */}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-black hover:text-red-900 transition-colors duration-200 font-semibold">
                Control Panel
              </Link>
            )}
            {/* Cart Icon with Dropdown */}
            <div className="relative">
              <button
                className="ml-4 text-black hover:text-red-900 transition-colors duration-200 relative"
                onClick={() => setCartOpen((v) => !v)}
                aria-label="Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 007 17h10a1 1 0 00.95-.68L21 9M7 13V6a1 1 0 011-1h5a1 1 0 011 1v7" />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">{cart.length}</span>
                )}
              </button>
              {cartOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
                  <div className="p-4 max-h-80 overflow-y-auto">
                    <h4 className="font-bold text-red-700 mb-2">Cart</h4>
                    {cart.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center py-4">Cart is empty</div>
                    ) : (
                      cart.map((item, idx) => (
                        <div key={item._id || idx} className="flex items-center gap-3 mb-3 border-b pb-2 last:border-b-0 last:pb-0">
                          {item.book?.image && (
                            <img src={item.book.image} alt={item.book.title} className="h-12 w-9 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{item.book?.title || 'Book'}</div>
                            <div className="text-xs text-gray-500">{item.book?.author}</div>
                            <div className="text-xs text-red-600">${Number(item.book?.price).toFixed(2)}</div>
                            <div className="text-xs text-gray-700">Qty: {item.quantity || 1}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t flex justify-end">
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      disabled={cart.length === 0}
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/cart');
                      }}
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Account Icon and Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="ml-4 flex items-center text-black hover:text-red-900 focus:outline-none transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path stroke="currentColor" strokeWidth="2" d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" />
                </svg>
                {/* Show user name if logged in */}
                {user?.name && (
                  <span className="ml-2 text-sm font-medium text-black max-w-[120px] truncate">{user.name}</span>
                )}
              </button>
              {/* Dropdown */}
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
                  <Link to="/profile" className="block px-4 py-2 text-black hover:bg-red-50 hover:text-red-900">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-black hover:bg-red-50 hover:text-red-900">Settings</Link>
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      window.location.href = '/';
                    }}
                    className="block w-full text-left px-4 py-2 text-black hover:bg-red-50 hover:text-red-900"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="text-red-700 hover:text-red-900 focus:outline-none transition-transform duration-200"
              aria-label="Toggle menu"
            >
              <svg
                className={`h-8 w-8 transform ${open ? 'rotate-90' : ''} transition-transform duration-300`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-white border-t-2 border-red-200 shadow transition-all duration-300 overflow-hidden ${
          open ? 'max-h-96 py-2' : 'max-h-0 py-0'
        }`}
        style={{ transitionProperty: 'max-height, padding' }}
      >
        {/* Mobile Search Bar */}
        <form className="block md:hidden px-6 py-2" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search books..."
            className="px-4 py-2 rounded-lg border border-red-200 shadow focus:outline-none focus:ring-2 focus:ring-red-200 transition w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
        {/* Only show Home and Contact if not admin */}
        {user?.role !== 'admin' && (
          <>
            <Link
              to="/dashboard"
              className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/contact"
              className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </>
        )}
        <Link
          to="/products"
          className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={() => setOpen(false)}
        >
          Products
        </Link>
        <Link
          to="/about"
          className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={() => setOpen(false)}
        >
          About
        </Link>
        {/* Admin Control Panel Link */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
            onClick={() => setOpen(false)}
          >
            Control Panel
          </Link>
        )}
        {/* Cart Icon with Dropdown (mobile) */}
        <div className="relative px-6 py-2">
          <button
            className="flex items-center text-black hover:text-red-900 focus:outline-none transition-colors duration-200 w-full"
            onClick={() => setCartOpen((v) => !v)}
            aria-label="Cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 007 17h10a1 1 0 00.95-.68L21 9M7 13V6a1 1 0 011-1h5a1 1 0 011 1v7" />
            </svg>
            Cart
            {cart.length > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-1.5">{cart.length}</span>
            )}
          </button>
          {cartOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
              <div className="p-4 max-h-80 overflow-y-auto">
                <h4 className="font-bold text-red-700 mb-2">Cart</h4>
                {cart.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4">Cart is empty</div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={item._id || idx} className="flex items-center gap-3 mb-3 border-b pb-2 last:border-b-0 last:pb-0">
                      {item.book?.image && (
                        <img src={item.book.image} alt={item.book.title} className="h-12 w-9 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{item.book?.title || 'Book'}</div>
                        <div className="text-xs text-gray-500">{item.book?.author}</div>
                        <div className="text-xs text-red-600">${Number(item.book?.price).toFixed(2)}</div>
                        <div className="text-xs text-gray-700">Qty: {item.quantity || 1}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t flex justify-end">
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setCartOpen(false);
                    navigate('/cart');
                  }}
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Account Icon and Dropdown */}
        <div className="relative px-6 py-2">
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="flex items-center text-black hover:text-red-900 focus:outline-none transition-colors duration-200 w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path stroke="currentColor" strokeWidth="2" d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" />
            </svg>
            {/* Show user name if logged in */}
            {user?.name && (
              <span className="ml-2 text-sm font-medium text-black max-w-[120px] truncate">{user.name}</span>
            )}
            {!user?.name && 'Account'}
          </button>
          {accountOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
              <Link to="/profile" className="block px-4 py-2 text-black hover:bg-red-50 hover:text-red-900" onClick={() => setAccountOpen(false)}>Profile</Link>
              <Link to="/settings" className="block px-4 py-2 text-black hover:bg-red-50 hover:text-red-900" onClick={() => setAccountOpen(false)}>Settings</Link>
              <button
                onClick={() => {
                  setAccountOpen(false);
                  window.location.href = '/login';
                }}
                className="block w-full text-left px-4 py-2 text-black hover:bg-red-50 hover:text-red-900"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
