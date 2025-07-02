// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true); // default to true
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      // Only block login if status is exactly 'pending' or 'declined'
      if (res.data.status === 'pending') {
        alert('Your account is pending approval by admin.');
        return;
      }
      if (res.data.status === 'declined') {
        alert('Your registration was declined by admin.');
        return;
      }
      if (remember) {
        login(res.data); // localStorage (default)
      } else {
        sessionStorage.setItem('user', JSON.stringify(res.data));
        login(res.data);
        localStorage.removeItem('user');
      }
      // Redirect based on user role
      console.log('Login role:', res.data.role);

      if (
        res.data.role === 'supplier department' ||
        res.data.role === 'supplier' ||
        res.data.role === 'Supplier Department'
      ) {
        window.location.href = '/supplier-dashboard';
      } else if (res.data.role === 'inventory department') {
        window.location.href = '/inventory';
      } else if (res.data.role === 'sales department') {
        window.location.href = '/sales-dashboard';
      } else if (res.data.role === 'admin' || res.data.role === 'customer') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/';
      }
      alert('Login successful!');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-poppins relative">
      {/* Logo at top left */}
      <div className="absolute top-8 left-8 z-10">
        <img src="/nbs.svg" alt="NBS Logo" className="h-20 w-30" />
      </div>
      {/* Left: Login Form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-black">Welcome back</h2>
          <p className="mb-8 text-gray-500">Please enter your details</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="remember" className="text-sm text-gray-700 select-none">Remember for 30 days</label>
              </div>
              <a
                href="/forgot-password"
                className="text-sm text-red-700 hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded transition-colors"
            >
              Sign in
            </button>
          </form>
          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?
            <a
              href="/register"
              className="ml-1 text-red-700 hover:underline font-semibold"
            >
              Sign up
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
        {/* Ani qmated Book */}
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
