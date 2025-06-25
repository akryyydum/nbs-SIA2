import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Order = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/orders/my`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setOrders(res.data || []);
      } catch {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(orderId);
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setOrders(orders =>
        orders.map(o =>
          o._id === orderId ? { ...o, status: 'declined' } : o
        )
      );
    } catch (err) {
      alert('Failed to cancel order');
    }
    setCancelling(null);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'accepted') return order.status === 'accepted';
    if (filter === 'declined') return order.status === 'declined';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-black">My Orders</h2>
      {/* Filter choices */}
      <div className="mb-6 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setFilter('all')}
        >All</button>
        <button
          className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setFilter('pending')}
        >Pending</button>
        <button
          className={`px-4 py-2 rounded ${filter === 'accepted' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setFilter('accepted')}
        >Accepted</button>
        <button
          className={`px-4 py-2 rounded ${filter === 'declined' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setFilter('declined')}
        >Declined</button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No orders found.</div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <div key={order._id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">Order ID:</span> {order._id}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${order.status === 'paid' ? 'bg-green-100 text-green-700'
                    : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                    : order.status === 'accepted' ? 'bg-blue-100 text-blue-700'
                    : order.status === 'declined' ? 'bg-gray-300 text-gray-700'
                    : 'bg-gray-100 text-gray-700'}`}>
                  {order.status}
                </span>
              </div>
              <div className="mb-2 text-sm text-gray-600">
                <span className="font-semibold">Placed:</span> {new Date(order.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold text-sm">Items:</span>
                <ul className="ml-4 text-sm">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 mb-1">
                      {item.book?.image && (
                        <img
                          src={item.book.image}
                          alt={item.book?.title || 'Book'}
                          className="h-8 w-6 object-cover rounded shadow"
                        />
                      )}
                      <span>
                        {item.book?.title || 'Book'} x {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 font-bold text-right">
                Total: ₱{Number(order.totalPrice).toFixed(2)}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition"
                  onClick={() => setModalOrder(order)}
                >
                  View
                </button>
                {/* Cancel button for pending orders */}
                {order.status === 'pending' && (
                  <button
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                    onClick={() => handleCancel(order._id)}
                    disabled={cancelling === order._id}
                  >
                    {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal for order details */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl font-bold"
              onClick={() => setModalOrder(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-black">
              Order Details
            </h3>
            <div className="space-y-2">
              <div><span className="font-semibold">Order ID:</span> {modalOrder._id}</div>
              <div><span className="font-semibold">Status:</span> {modalOrder.status}</div>
              <div><span className="font-semibold">Total Price:</span> ₱{Number(modalOrder.totalPrice).toFixed(2)}</div>
              <div>
                <span className="font-semibold">Items:</span>
                <ul className="list-disc ml-6">
                  {modalOrder.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 mb-1">
                      {item.book?.image && (
                        <img
                          src={item.book.image}
                          alt={item.book?.title || 'Book'}
                          className="h-10 w-8 object-cover rounded shadow"
                        />
                      )}
                      <span>
                        {item.book?.title || 'Book'} x {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold">Placed:</span> {new Date(modalOrder.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
