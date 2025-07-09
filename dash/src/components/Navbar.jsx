import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaTrashAlt, FaCheckSquare, FaRegSquare, FaShoppingCart, FaUserCircle, FaSignOutAlt, FaSearch } from 'react-icons/fa';

// Add this API instance for LAN compatibility
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`,
});

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const accountRef = useRef();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // <-- get current location
  const lastClickedLinkRef = useRef(null);

  // Define fetchCart so it can be reused
  const fetchCart = async () => {
    if (!user?.token) {
      setCart([]);
      return;
    }
    try {
      const res = await API.get('/cart', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart(res.data.items || []);
    } catch {
      setCart([]);
    }
  };

  // Expose fetchCart globally for cross-component updates
  useEffect(() => {
    window.__nbsFetchCart = fetchCart;
    // Listen for custom cart-updated event
    const handler = () => fetchCart();
    window.addEventListener('cart-updated', handler);
    return () => {
      window.removeEventListener('cart-updated', handler);
      // Optionally clean up global
      if (window.__nbsFetchCart === fetchCart) delete window.__nbsFetchCart;
    };
  }, [user]);

  // Fetch cart from backend for the logged-in user
  useEffect(() => {
    fetchCart();
  }, [user]);

  // Remove socket.io useEffect for cart updates

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  // Animation handler for link clicks
  const handleLinkClick = (e) => {
    const el = e.currentTarget;
    el.classList.remove('link-pop-animate'); // reset if needed
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('link-pop-animate');
    lastClickedLinkRef.current = el;
  };

  // Remove animation class after animation ends
  useEffect(() => {
    const handler = (e) => {
      if (e.animationName === 'link-pop') {
        e.target.classList.remove('link-pop-animate');
      }
    };
    document.addEventListener('animationend', handler, true);
    return () => document.removeEventListener('animationend', handler, true);
  }, []);

  // Determine if we are on the sales dashboard
  const isSalesDashboard = location.pathname === '/sales-dashboard';

  return (
    <nav className="bg-white/60 backdrop-blur-md border-b-2 border-red-200 shadow-md font-poppins bold sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-16 items-center relative">
          {/* Left Section (Nav Links - desktop only) */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Nav Links (desktop only) */}
            <div className="hidden md:flex space-x-6 items-center flex-shrink-0">
              {user?.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="text-black hover:text-red-900 transition-colors duration-200 font-semibold"
                  onClick={handleLinkClick}
                >
                  Control Panel
                </Link>
              ) : (
                // Only show these links if NOT on sales dashboar
                !isSalesDashboard && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-black hover:text-red-900 transition-colors duration-200 font-semibold"
                      onClick={handleLinkClick}
                    >
                      Home
                    </Link>
                    
                    <Link
                      to="/products"
                      className="text-black hover:text-red-900 transition-colors duration-200 font-semibold"
                      onClick={handleLinkClick}
                    >
                      Products
                    </Link>
                    <Link
                      to="/contact"
                      className="text-black hover:text-red-900 transition-colors duration-200 font-semibold"
                      onClick={handleLinkClick}
                    >
                      Contact
                    </Link>
                    <Link
                      to="/about"
                      className="text-black hover:text-red-900 transition-colors duration-200 font-semibold"
                      onClick={handleLinkClick}
                    >
                      About
                    </Link>
                    <Link
                      to="/orders"
                      className="text-black hover:text-red-900 transition-colors duration-200 font-semibold"
                      onClick={handleLinkClick}
                    >
                      Orders
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
          {/* Center Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none select-none z-10">
            <img src="/nbs.svg" alt="NBS Logo" className="h-12 object-contain" />
          </div>
          {/* Right Section (Cart, Account, Admin, Search) */}
          <div className="hidden md:flex space-x-8 items-center flex-shrink-0">
            {/* Admin Control Panel Link */}
            
            {/* Cart Icon with Dropdown */}
            {!isSalesDashboard && (
              <div className="relative">
                <button
                  className="ml-4 text-black hover:text-red-900 transition-colors duration-200 relative"
                  onClick={() => setCartOpen((v) => !v)}
                  aria-label="Cart"
                >
                  <FaShoppingCart className="h-7 w-7 transition-transform duration-300" style={{ transform: cartOpen ? 'scale(1.1)' : 'scale(1)' }} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 animate-bounce">{cart.length}</span>
                  )}
                </button>
                {cartOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
                    <div className="p-4 max-h-80 overflow-y-auto">
                      <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                        <FaShoppingCart className="text-red-600" /> Cart
                      </h4>
                      {cart.length === 0 ? (
                        <div className="text-gray-400 text-sm text-center py-4 animate-fade-in">Cart is empty</div>
                      ) : (
                        cart.map((item, idx) => (
                          <div
                            key={item._id || idx}
                            className="flex items-center gap-3 mb-3 border-b pb-2 last:border-b-0 last:pb-0 transition-all duration-200 hover:bg-red-50 rounded group"
                          >
                            {/* Checkbox for selection */}
                            <button
                              className="focus:outline-none"
                              onClick={() => {
                                setCart(cart.map((c, i) =>
                                  i === idx ? { ...c, selected: !c.selected } : c
                                ));
                              }}
                            >
                              {item.selected ? (
                                <FaCheckSquare className="text-red-600 text-lg transition-transform duration-200 scale-110" />
                              ) : (
                                <FaRegSquare className="text-gray-400 text-lg" />
                              )}
                            </button>
                            {item.book?.image && (
                              <img
                                src={item.book.image}
                                alt={item.book.title}
                                className="h-12 w-9 object-cover rounded shadow-sm transition-transform duration-200 group-hover:scale-105"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{item.book?.title || 'Book'}</div>
                              <div className="text-xs text-gray-500">{item.book?.author}</div>
                              <div className="text-xs text-red-600">₱{Number(item.book?.price).toFixed(2)}</div>
                              <div className="text-xs text-gray-700">Qty: {item.quantity || 1}</div>
                            </div>
                            {/* Delete button */}
                            <button
                              className="text-red-500 hover:text-red-700 text-lg px-2 transition-transform duration-200 hover:scale-125"
                              title="Remove from cart"
                              onClick={async () => {
                                try {
                                  await API.delete(`/cart/${item._id}`, { headers: { Authorization: `Bearer ${user.token}` } });
                                  setCart(cart.filter((_, i) => i !== idx));
                                } catch {
                                  // Optionally show error
                                }
                              }}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t flex justify-between items-center">
                      {/* Select/Deselect All */}
                      <button
                        className="text-xs text-red-600 hover:underline flex items-center gap-1"
                        type="button"
                        onClick={() => {
                          const allSelected = cart.every(item => item.selected);
                          setCart(cart.map(item => ({ ...item, selected: !allSelected })));
                        }}
                      >
                        {cart.every(item => item.selected) ? <FaCheckSquare /> : <FaRegSquare />}
                        {cart.every(item => item.selected) ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        disabled={cart.filter(item => item.selected).length === 0}
                        onClick={() => {
                          setCartOpen(false);
                          // Pass selected items to checkout (example: via state or query)
                          const selectedIds = cart.filter(item => item.selected).map(item => item._id);
                          navigate('/checkout', { state: { selectedCartIds: selectedIds } });
                        }}
                      >
                        <FaShoppingCart /> Checkout Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Account Icon and Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="ml-4 flex items-center text-black hover:text-red-900 focus:outline-none transition-colors duration-200"
              >
                {/* Show profile image if available, else fallback to icon */}
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <FaUserCircle className="h-8 w-8" />
                )}
              </button>
              {/* Dropdown */}
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
                  <Link to="/profile" className="block px-4 py-2 text-black hover:bg-red-50 hover:text-red-900 flex items-center gap-2">
                    {/* Show profile image in dropdown if available */}
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="h-5 w-5 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <FaUserCircle />
                    )}
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      window.location.href = '/';
                    }}
                    className="block w-full text-left px-4 py-2 text-black hover:bg-red-50 hover:text-red-900 flex items-center gap-2"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
            {/* Search Bar (desktop only, now after profile) */}
            <form className="hidden md:block" onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search books..."
                  className="px-4 py-2 rounded-lg border border-red-200 shadow focus:outline-none focus:ring-2 focus:ring-red-200 transition w-64"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800 transition"
                >
                  <FaSearch />
                </button>
              </div>
            </form>
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
              onClick={e => { setOpen(false); handleLinkClick(e); }}
            >
              Home
            </Link>
            <Link
              to="/contact"
              className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
              onClick={e => { setOpen(false); handleLinkClick(e); }}
            >
              Contact
            </Link>
          </>
        )}
        <Link
          to="/products"
          className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={e => { setOpen(false); handleLinkClick(e); }}
        >
          Products
        </Link>
        <Link
          to="/about"
          className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={e => { setOpen(false); handleLinkClick(e); }}
        >
          About
        </Link>
        {/* Admin Control Panel Link */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="block px-6 py-2 text-black hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
            onClick={e => { setOpen(false); handleLinkClick(e); }}
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
<span className="absolute -top-1 right-0 bg-red-600 text-white text-xs rounded-full px-1.5">{cart.length}</span>

            )}
          </button>
          {cartOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-red-200 rounded-lg shadow-lg z-50 animate-fade-in">
              <div className="p-4 max-h-80 overflow-y-auto">
                <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                  <FaShoppingCart className="text-red-600" /> Cart
                </h4>
                {cart.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4 animate-fade-in">Cart is empty</div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="flex items-center gap-3 mb-3 border-b pb-2 last:border-b-0 last:pb-0 transition-all duration-200 hover:bg-red-50 rounded group"
                    >
                      {/* Checkbox for selection */}
                      <button
                        className="focus:outline-none"
                        onClick={() => {
                          setCart(cart.map((c, i) =>
                            i === idx ? { ...c, selected: !c.selected } : c
                          ));
                        }}
                      >
                        {item.selected ? (
                          <FaCheckSquare className="text-red-600 text-lg transition-transform duration-200 scale-110" />
                        ) : (
                          <FaRegSquare className="text-gray-400 text-lg" />
                        )}
                      </button>
                      {item.book?.image && (
                        <img
                          src={item.book.image}
                          alt={item.book.title}
                          className="h-12 w-9 object-cover rounded shadow-sm transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{item.book?.title || 'Book'}</div>
                        <div className="text-xs text-gray-500">{item.book?.author}</div>
                        <div className="text-xs text-red-600">₱{Number(item.book?.price).toFixed(2)}</div>
                        <div className="text-xs text-gray-700">Qty: {item.quantity || 1}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t flex justify-between items-center">
                {/* Select/Deselect All */}
                <button
                  className="text-xs text-red-600 hover:underline"
                  type="button"
                  onClick={() => {
                    const allSelected = cart.every(item => item.selected);
                    setCart(cart.map(item => ({ ...item, selected: !allSelected })));
                  }}
                >
                  {cart.every(item => item.selected) ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  disabled={cart.filter(item => item.selected).length === 0}
                  onClick={() => {
                    setCartOpen(false);
                    // Pass selected items to checkout (example: via state or query)
                    const selectedIds = cart.filter(item => item.selected).map(item => item._id);
                    navigate('/checkout', { state: { selectedCartIds: selectedIds } });
                  }}
                >
                  Checkout Selected
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
