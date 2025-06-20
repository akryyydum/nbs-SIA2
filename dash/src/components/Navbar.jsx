import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b-2 border-red-200 shadow-md font-lora">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img src="/nbs.svg" alt="NBS Logo" className="h-10 w-10 mr-2" />
            <span className="text-xl font-bold text-red-700 tracking-wide">NBS Bookshop</span>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-red-700 hover:text-red-900 transition-colors duration-200 font-semibold">
              Home
            </Link>
            <Link to="/books" className="text-red-700 hover:text-red-900 transition-colors duration-200 font-semibold">
              Books
            </Link>
            <Link to="/about" className="text-red-700 hover:text-red-900 transition-colors duration-200 font-semibold">
              About
            </Link>
            <Link to="/contact" className="text-red-700 hover:text-red-900 transition-colors duration-200 font-semibold">
              Contact
            </Link>
            <Link to="/login" className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all duration-200 shadow font-semibold">
              Login
            </Link>
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
        <Link
          to="/"
          className="block px-6 py-2 text-red-700 hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={() => setOpen(false)}
        >
          Home
        </Link>
        <Link
          to="/books"
          className="block px-6 py-2 text-red-700 hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={() => setOpen(false)}
        >
          Books
        </Link>
        <Link
          to="/about"
          className="block px-6 py-2 text-red-700 hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={() => setOpen(false)}
        >
          About
        </Link>
        <Link
          to="/contact"
          className="block px-6 py-2 text-red-700 hover:bg-red-50 hover:text-red-900 font-semibold transition-colors duration-200"
          onClick={() => setOpen(false)}
        >
          Contact
        </Link>
        <Link
          to="/login"
          className="block px-6 py-2 mt-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all duration-200 shadow font-semibold mx-4"
          onClick={() => setOpen(false)}
        >
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
