// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      login(res.data);
      alert('Login successful!');
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-lora">
      {/* Left: Login Form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-red-200">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/nbs.svg" alt="NBS Logo" className="h-30 w-30" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-6 font-Poppins tracking-wide">
            Login
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-red-900"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-red-900"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
            >
              Login
            </button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-red-700">Don't have an account?</span>
            <a
              href="/register"
              className="ml-2 text-red-600 hover:underline font-semibold"
            >
              Register
            </a>
          </div>
        </div>
      </div>
      {/* Right: Animated Book with blurred background image */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-red-50 relative overflow-hidden">
        {/* Blurred background image */}
        <img
          src="https://interimweb.s3-ap-southeast-1.amazonaws.com/merchant-images/products/BOOKSTORES+AND+OFFICEWAREHOUSE/BOOKSTORE+AND+OFFICEWAREHOUSE+-+Bookstore+(2).jpg"
          alt="Book Shop Background"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-125"
          style={{ zIndex: 0 }}
        />
        {/* Animated Book */}
        <div className="relative w-80 h-80 flex items-center justify-center" style={{ zIndex: 1 }}>
          {/* Book cover */}
          <div className="absolute w-52 h-72 bg-white border-4 border-red-600 rounded-lg shadow-lg animate-bounce" style={{ zIndex: 2 }} />
          {/* Book pages (animated flipping effect) */}
          <div className="absolute w-48 h-64 bg-red-100 border-2 border-red-300 rounded-lg shadow-inner animate-pulse" style={{ left: '24px', top: '12px', zIndex: 1 }} />
          {/* Book spine */}
          <div className="absolute w-5 h-72 bg-red-600 rounded-l-lg left-0 top-0" style={{ zIndex: 3 }} />
          {/* Decorative: flying pages */}
          <svg className="absolute left-60 top-10 animate-spin-slow" width="50" height="50" viewBox="0 0 40 40">
            <rect x="10" y="10" width="20" height="10" rx="2" fill="#fff" stroke="#ef4444" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
