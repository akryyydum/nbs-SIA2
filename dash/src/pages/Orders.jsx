import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Add metrics/chart state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [aov, setAov] = useState(0);
  const [topBooksData, setTopBooksData] = useState([]);
  const [categoryChartData, setCategoryChartData] = useState([]);

  // ✅ FIXED: This ensures axios works on both localhost and LAN
  const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}/api`,
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
  }, [modalOpen]);

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

  const handleAccept = async (order) => {
    if (!window.confirm('Accept this order? This will decrease book stocks.')) return;
    try {
      await API.put(`/orders/${order._id}/accept`);
      setModalOpen(false);
    } catch (err) {
      alert('Failed to accept order: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDecline = async (order) => {
    if (!window.confirm('Decline this order?')) return;
    try {
      await API.put(`/orders/${order._id}/decline`);
      setModalOpen(false);
    } catch (err) {
      alert('Failed to decline order');
    }
  };

  // ✅ Fixed: ship endpoint behaves same as accept
  const handleShip = async (order) => {
    if (!window.confirm('Mark this order as shipped?')) return;
    try {
      await API.put(`/orders/${order._id}/ship`);
      setModalOpen(false);
    } catch (err) {
      alert('Failed to mark as shipped: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Calculate metrics and chart data when orders change
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setTotalRevenue(0);
      setTotalTransactions(0);
      setAov(0);
      setTopBooksData([]);
      setCategoryChartData([]);
      return;
    }
    // Revenue/transactions logic (same as SalesDashboard)
    const acceptedOrPaidOrders = orders.filter(order => {
      if (order.modeofPayment === "Bank Transfer" || order.modeofPayment === "bank") {
        return order.status === "paid";
      }
      if (order.modeofPayment === "Cash") {
        return true;
      }
      if (order.modeofPayment === "Cash on Delivery" || order.modeofPayment === "cod") {
        return order.status === "received";
      }
      return false;
    });

    const revenue = acceptedOrPaidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const transactions = acceptedOrPaidOrders.length;
    const avgOrderValue = transactions > 0 ? revenue / transactions : 0;
    setTotalRevenue(revenue);
    setTotalTransactions(transactions);
    setAov(avgOrderValue);

    // Top books and category chart
    const bookSalesMap = {};
    const categorySalesMap = {};
    acceptedOrPaidOrders.forEach(order => {
      order.items.forEach(item => {
        const bookTitle = item.book?.title || 'Unknown';
        bookSalesMap[bookTitle] = (bookSalesMap[bookTitle] || 0) + item.quantity;
        const category = item.book?.category || 'Uncategorized';
        categorySalesMap[category] = (categorySalesMap[category] || 0) + item.quantity;
      });
    });

    const topBooks = Object.entries(bookSalesMap)
      .map(([title, quantity]) => ({ title, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const categoryData = Object.entries(categorySalesMap).map(([category, quantity]) => ({ category, quantity }));

    setTopBooksData(topBooks);
    setCategoryChartData(categoryData);
  }, [orders]);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Orders Management</h2>

      {/* Metrics and Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm text-gray-500">Total Sales Revenue</div>
          <div className="text-2xl font-bold text-red-700">
            ₱{Number(totalRevenue).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm text-gray-500">Total Transactions</div>
          <div className="text-2xl font-bold text-red-700">
            {totalTransactions}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm text-gray-500">Average Order Value</div>
          <div className="text-2xl font-bold text-red-700">
            ₱{Number(aov).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Top Selling Books</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBooksData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <XAxis dataKey="title" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#dc2626" barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Orders by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={categoryChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quantity" stroke="#dc2626" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

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
            <h3 className="text-xl font-bold mb-4 text-red-700">Order Details</h3>
            <div className="space-y-2">
              <div><span className="font-semibold">Order ID:</span> {selectedOrder._id}</div>
              <div><span className="font-semibold">User:</span> {selectedOrder.user?.name} ({selectedOrder.user?.email})</div>
              <div><span className="font-semibold">Status:</span> {selectedOrder.status}</div>
              <div><span className="font-semibold">Total Price:</span> ₱{Number(selectedOrder.totalPrice).toFixed(2)}</div>
              <div>
                <span className="font-semibold">Items:</span>
                <ul className="list-disc ml-6">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx}>{item.book?.title || 'Book'} x {item.quantity}</li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold">Created:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            </div>

            {(selectedOrder.status === 'pending' || selectedOrder.status === 'accepted') && (
              <div className="flex gap-4 mt-6">
                {selectedOrder.status === 'pending' && (
                  <>
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
                  </>
                )}
                {selectedOrder.status === 'accepted' && (
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => handleShip(selectedOrder)}
                  >
                    Ship
                  </button>
                )}
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
              <th className="px-6 py-3 border-b">Payment</th>
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
                      : order.status === 'out for delivery' ? 'bg-blue-100 text-blue-700'
                      : order.status === 'received' ? 'bg-green-200 text-green-800'
                      : order.status === 'accepted' ? 'bg-blue-100 text-blue-700'
                      : order.status === 'declined' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'}`}>
                    {order.status === 'out for delivery'
                      ? 'shipped'
                      : order.status === 'received'
                        ? 'received'
                        : order.status}
                  </span>
                </td>
                <td className="border-b px-6 py-3">{order.modeofPayment || 'N/A'}</td>
                <td className="border-b px-6 py-3">₱{Number(order.totalPrice).toFixed(2)}</td>
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
