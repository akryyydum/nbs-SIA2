// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true); // default to true
  const { login } = useAuth();
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Show password toggle

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

  // Simulate backend API for OTP (replace with your real API)
  const sendOtp = async (email) => {
    setOtpLoading(true);
    try {
      // First, check if email exists in the system
      const checkRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || window.location.origin + '/api'}/auth/check-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );
      // Fix: If your VITE_API_BASE_URL is not set, window.location.origin will be :5173 (frontend), not backend!
      // Make sure VITE_API_BASE_URL is set to your backend (e.g. http://localhost:5000/api)
      if (!checkRes.ok) {
        const errMsg = await checkRes.json();
        alert(errMsg.message || 'Email not found in the system.');
        setOtpLoading(false);
        return;
      }
      // If exists, send OTP
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || window.location.origin + '/api'}/auth/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );
      setOtpSent(true);
      alert('OTP sent to your email.');
    } catch {
      alert('Failed to send OTP. Please check your email.');
    }
    setOtpLoading(false);
  };

  const resetPassword = async () => {
    setOtpLoading(true);
    try {
      // Replace with your API call
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || window.location.origin + '/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword })
      });
      if (!res.ok) throw new Error();
      alert('Password reset successful. You can now log in.');
      setShowForgot(false);
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
      setOtpSent(false);
    } catch {
      alert('Failed to reset password. Please check your OTP and try again.');
    }
    setOtpLoading(false);
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-700 text-sm"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
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
              <button
                type="button"
                className="text-sm text-red-700 hover:underline font-medium"
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </button>
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
      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-modal-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[350px] w-full max-w-xs relative border border-red-200 animate-modal-fade-in">
            <h2 className="text-2xl font-bold text-center text-red-700 mb-2">Forgot password?</h2>
            <div className="text-center text-gray-500 text-sm mb-6">
              Remember your password?{' '}
              <span
                className="text-red-600 hover:underline cursor-pointer"
                onClick={() => {
                  setShowForgot(false);
                  setForgotEmail('');
                  setOtp('');
                  setNewPassword('');
                  setOtpSent(false);
                }}
              >
                Login here
              </span>
            </div>
            {!otpSent ? (
              <>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Email address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-2 border border-red-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
                />
                <button
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-base"
                  onClick={() => sendOtp(forgotEmail)}
                  disabled={otpLoading || !forgotEmail}
                >
                  {otpLoading ? 'Sending OTP...' : 'Reset password'}
                </button>
              </>
            ) : (
              <>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Enter OTP sent to your email</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="OTP"
                  required
                  className="w-full px-4 py-2 border border-red-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
                />
                <label className="block mb-2 text-sm font-semibold text-gray-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                  className="w-full px-4 py-2 border border-red-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
                />
                <button
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-base"
                  onClick={resetPassword}
                  disabled={otpLoading || !otp || !newPassword}
                >
                  {otpLoading ? 'Resetting...' : 'Reset password'}
                </button>
              </>
            )}
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-red-600 text-2xl"
              onClick={() => {
                setShowForgot(false);
                setForgotEmail('');
                setOtp('');
                setNewPassword('');
                setOtpSent(false);
              }}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
          </div>
          <style>{`
            .animate-modal-fade-in {
              animation: modalFadeIn 0.35s cubic-bezier(.4,0,.2,1);
            }
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.96) translateY(24px);}
              to { opacity: 1; transform: scale(1) translateY(0);}
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
