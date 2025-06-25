import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Order = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-red-700">My Orders</h2>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No orders found.</div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">Order ID:</span> {order._id}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${order.status === 'paid' ? 'bg-green-100 text-green-700'
                    : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
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
                    <li key={idx}>
                      {item.book?.title || 'Book'} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 font-bold text-right">
                Total: ₱{Number(order.totalPrice).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Order;
