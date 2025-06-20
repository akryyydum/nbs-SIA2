// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      login(res.data);
      alert('Registered and logged in!');
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Name" required />
      <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="Email" required />
      <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Password" required />
      <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
        <option value="customer">Customer</option>
        <option value="admin">Admin</option> {/* Can hide/remove if you want only controlled admin creation */}
      </select>
      <button type="submit">Register</button>
    </form>
  );
};

export default RegisterPage;
