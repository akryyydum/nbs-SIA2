import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser, acceptUser, declineUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'customer', status: 'pending' };

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
        await createUser({ ...form, status: 'pending' }, user.token);
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
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">User Management</h2>
      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-4 items-end bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border border-red-100">
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
          <option value="pending">Pending</option>
          <option value="active">Active</option>
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
      <div
        className="overflow-x-auto rounded-2xl shadow-2xl border border-red-100"
        style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)'
        }}
      >
        <table className="min-w-full rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-white/70 text-red-700 font-semibold text-lg">
              <th className="px-6 py-3 border-b">Name</th>
              <th className="px-6 py-3 border-b">Email</th>
              <th className="px-6 py-3 border-b">Role</th>
              <th className="px-6 py-3 border-b">Status</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No users found</td>
              </tr>
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-red-50 transition">
                <td className="border-b px-6 py-3">{u.name}</td>
                <td className="border-b px-6 py-3">{u.email}</td>
                <td className="border-b px-6 py-3 capitalize">{u.role}</td>
                <td className="border-b px-6 py-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                    ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="border-b px-6 py-3">
                  <button
                    className="text-blue-600 hover:bg-blue-50 transition rounded px-3 py-1 mr-2"
                    onClick={() => handleEdit(u)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:bg-red-50 transition rounded px-3 py-1"
                    onClick={() => handleDelete(u._id)}
                  >
                    Delete
                  </button>
                  {u.status === 'pending' && (
                    <>
                      <button
                        className="ml-2 text-green-600 hover:bg-green-50 transition rounded px-3 py-1"
                        onClick={async () => {
                          try {
                            await acceptUser(u._id, user.token);
                            fetchUsers();
                          } catch (err) {
                            alert('Failed to accept user');
                          }
                        }}
                      >
                        Accept
                      </button>
                      <button
                        className="ml-2 text-yellow-600 hover:bg-yellow-50 transition rounded px-3 py-1"
                        onClick={async () => {
                          try {
                            await declineUser(u._id, user.token);
                            fetchUsers();
                          } catch (err) {
                            alert('Failed to decline user');
                          }
                        }}
                      >
                        Decline
                      </button>
                    </>
                  )}
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
