import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'customer', status: 'active' };

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers(user.token);
      setUsers(res.data);
    } catch (err) {
      alert('Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser(editing, form, user.token);
      } else {
        await createUser(form, user.token);
      }
      setForm(emptyForm);
      setEditing(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (u) => {
    setEditing(u._id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, status: u.status });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id, user.token);
      fetchUsers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-red-700">User Management</h2>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-4 items-end">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          className="border px-3 py-2 rounded"
        />
        {!editing && (
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            className="border px-3 py-2 rounded"
          />
        )}
        <select
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          className="border px-3 py-2 rounded"
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="inventory department">Inventory Department</option>
          <option value="sales department">Sales Department</option>
          <option value="supplier department">Supplier Department</option>
        </select>
        <select
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          className="border px-3 py-2 rounded"
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">
          {editing ? 'Update' : 'Create'}
        </button>
        {editing && (
          <button type="button" className="ml-2 px-4 py-2 rounded border" onClick={() => { setEditing(null); setForm(emptyForm); }}>
            Cancel
          </button>
        )}
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-red-100">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u._id}>
                <td className="border px-4 py-2">{u.name}</td>
                <td className="border px-4 py-2">{u.email}</td>
                <td className="border px-4 py-2">{u.role}</td>
                <td className="border px-4 py-2">{u.status}</td>
                <td className="border px-4 py-2">
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="text-red-600" onClick={() => handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
