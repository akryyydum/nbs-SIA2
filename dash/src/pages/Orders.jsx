import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const API = axios.create({
    baseURL: '/api', // Use relative path for any IP
    headers: { Authorization: `Bearer ${user?.token}` }
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (err) {
      alert('Failed to fetch orders');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [modalOpen]); // Refetch orders when modalOpen changes

  const handleView = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await API.delete(`/orders/${id}`);
      fetchOrders();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Accept order: set status to 'accepted', decrease book stocks
  const handleAccept = async (order) => {
    if (!window.confirm('Accept this order? This will decrease book stocks.')) return;
    try {
      // Only update order status to 'accepted' (backend will handle stock)
      await API.put(`/orders/${order._id}/accept`);
      setModalOpen(false); // This will trigger useEffect to refetch orders
    } catch (err) {
      alert('Failed to accept order: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Decline order: set status to 'declined'
  const handleDecline = async (order) => {
    if (!window.confirm('Decline this order?')) return;
    try {
      await API.put(`/orders/${order._id}/decline`);
      setModalOpen(false); // This will trigger useEffect to refetch orders
    } catch (err) {
      alert('Failed to decline order');
    }
  };

  // If you have any bank verification logic in this file, replace simulation with a real API call.
  // For example, add a function like this:

  const verifyBank = async (bankSystem, bankInfo) => {
    try {
      const res = await API.post('/bank/verify', {
        bankSystem,
        ...bankInfo
      });
      return res.data; // { verified: true/false, balance, message }
    } catch (err) {
      return { verified: false, message: err.response?.data?.message || 'Bank verification failed.' };
    }
  };

  // Use verifyBank() wherever you need to verify a bank account, and handle the result accordingly.
  // Remove any simulation or hardcoded logic for bank verification.

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Orders Management</h2>
      {/* Modal for viewing order details */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => { setModalOpen(false); setSelectedOrder(null); }}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">
              Order Details
            </h3>
            <div className="space-y-2">
              <div><span className="font-semibold">Order ID:</span> {selectedOrder._id}</div>
              <div><span className="font-semibold">User:</span> {selectedOrder.user?.name} ({selectedOrder.user?.email})</div>
              <div><span className="font-semibold">Status:</span> {selectedOrder.status}</div>
              <div><span className="font-semibold">Total Price:</span> ${Number(selectedOrder.totalPrice).toFixed(2)}</div>
              <div>
                <span className="font-semibold">Items:</span>
                <ul className="list-disc ml-6">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx}>
                      {item.book?.title || 'Book'} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold">Created:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            </div>
            {/* Accept/Decline buttons for pending orders */}
            {selectedOrder.status === 'pending' && (
              <div className="flex gap-4 mt-6">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => handleAccept(selectedOrder)}
                >
                  Accept
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={() => handleDecline(selectedOrder)}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
              <th className="px-6 py-3 border-b">Order ID</th>
              <th className="px-6 py-3 border-b">User</th>
              <th className="px-6 py-3 border-b">Status</th>
              <th className="px-6 py-3 border-b">Total Price</th>
              <th className="px-6 py-3 border-b">Created</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No orders found</td>
              </tr>
            ) : orders.map(order => (
              <tr key={order._id} className="hover:bg-red-50 transition">
                <td className="border-b px-6 py-3">{order._id}</td>
                <td className="border-b px-6 py-3">{order.user?.name || 'N/A'}</td>
                <td className="border-b px-6 py-3 capitalize">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                    ${order.status === 'paid' ? 'bg-green-100 text-green-700'
                      : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                      : order.status === 'accepted' ? 'bg-blue-100 text-blue-700'
                      : order.status === 'declined' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="border-b px-6 py-3">${Number(order.totalPrice).toFixed(2)}</td>
                <td className="border-b px-6 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="border-b px-6 py-3">
                  <button
                    className="text-blue-600 hover:bg-blue-50 transition rounded px-3 py-1 mr-2"
                    onClick={() => handleView(order)}
                  >
                    View
                  </button>
                  <button
                    className="text-red-600 hover:bg-red-50 transition rounded px-3 py-1"
                    onClick={() => handleDelete(order._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
