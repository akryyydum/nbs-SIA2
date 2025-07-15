import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import React from 'react';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newOrder, setNewOrder] = useState({
    user: "",
    items: [{ book: "", quantity: 1 }],
    modeofPayment: "Cash"
  });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [aov, setAov] = useState(0);
  const [topBooksData, setTopBooksData] = useState([]);
  const [categoryChartData, setCategoryChartData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

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

  const customerOrders = useMemo(
    () => orders.filter(order =>
      !order.isSupplierOrder && order.modeofPayment !== 'Supplier Order'
    ),
    [orders]
  );

  // Pagination logic should use customerOrders
  const totalPages = Math.ceil(customerOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = customerOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  // Calculate metrics and chart data when customerOrders change
  useEffect(() => {
    if (!customerOrders || customerOrders.length === 0) {
      setTotalRevenue(0);
      setTotalTransactions(0);
      setAov(0);
      setTopBooksData([]);
      setCategoryChartData([]);
      return;
    }

    // Only count orders that are actually completed/approved/received/paid
    const acceptedOrPaidOrders = customerOrders.filter(order => {
      if (order.modeofPayment === "Bank Transfer" || order.modeofPayment === "bank") {
        return order.status === "paid";
      }
      if (order.modeofPayment === "Cash") {
        return order.status === "accepted" || order.status === "received";
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
  }, [customerOrders]);

  // Fetch books and users for the add order form
  useEffect(() => {
    if (showAddModal) {
      API.get('/books').then(res => setBooks(res.data || []));
      API.get('/users').then(res => setUsers(res.data || []));
    }
  }, [showAddModal]);

  // Add order handler
  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        user: newOrder.user,
        items: newOrder.items.map(i => ({ book: i.book, quantity: Number(i.quantity) })),
        modeofPayment: "Cash"
      };
      await API.post('/orders', orderData);
      setShowAddModal(false);
      setNewOrder({ user: "", items: [{ book: "", quantity: 1 }], modeofPayment: "Cash" });
      fetchOrders();
      alert("Order created!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create order");
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Orders Management</h2>

      {/* Add Order Button */}
      <div className="mb-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setShowAddModal(true)}
        >
          + Add Order
        </button>
      </div>

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

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <form
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative space-y-4"
            onSubmit={handleAddOrder}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl font-bold"
              onClick={() => setShowAddModal(false)}
              type="button"
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-2 text-black">Add New Order</h3>
            <div>
              <label className="font-semibold">Customer:</label>
              <select
                required
                className="ml-2 border px-2 py-1 rounded w-full"
                value={newOrder.user}
                onChange={e => setNewOrder(o => ({ ...o, user: e.target.value }))}
              >
                <option value="">Select customer</option>
                {users.filter(u => u.role === 'customer').map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold">Mode of Payment:</label>
              <input
                type="text"
                className="ml-2 border px-2 py-1 rounded w-full bg-gray-100"
                value="Cash"
                disabled
              />
            </div>
            <div>
              <label className="font-semibold">Items:</label>
              {newOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2 flex-wrap">
                  <select
                    required
                    className="border px-2 py-1 rounded min-w-0 w-full max-w-xs flex-1"
                    value={item.book}
                    onChange={e => {
                      const items = [...newOrder.items];
                      items[idx].book = e.target.value;
                      setNewOrder(o => ({ ...o, items }));
                    }}
                  >
                    <option value="">Select book</option>
                    {books.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.title} {b.author ? `by ${b.author}` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="border px-2 py-1 rounded w-16"
                    value={item.quantity}
                    onChange={e => {
                      const items = [...newOrder.items];
                      items[idx].quantity = e.target.value;
                      setNewOrder(o => ({ ...o, items }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="text-red-600 font-bold"
                    onClick={() => {
                      setNewOrder(o => ({
                        ...o,
                        items: o.items.filter((_, i) => i !== idx)
                      }));
                    }}
                    disabled={newOrder.items.length === 1}
                    style={{ minWidth: 32 }}
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                className="text-green-600 font-bold"
                onClick={() => setNewOrder(o => ({
                  ...o,
                  items: [...o.items, { book: "", quantity: 1 }]
                }))}
              >+ Add Item</button>
            </div>
            {/* Optional: Show a summary of selected books */}
            {newOrder.items.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Summary:</span>
                <ul className="list-disc ml-6">
                  {newOrder.items.map((item, idx) => {
                    const book = books.find(b => b._id === item.book);
                    return (
                      <li key={idx}>
                        {book ? book.title : "Select a book"} x {item.quantity}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
            >
              Create Order
            </button>
          </form>
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
              <th className="px-6 py-3 border-b text-left">Order ID</th>
              <th className="px-6 py-3 border-b text-left">User</th>
              <th className="px-6 py-3 border-b text-left">Status</th>
              <th className="px-6 py-3 border-b text-left">Payment</th>
              <th className="px-6 py-3 border-b text-left">Total Price</th>
              <th className="px-6 py-3 border-b text-left">Created</th>
              <th className="px-6 py-3 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : customerOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">No orders found</td>
              </tr>
            ) : paginatedOrders.map(order => (
              <tr key={order._id} className="hover:bg-red-50 transition">
                <td className="border-b px-6 py-3 text-left">{order._id}</td>
                <td className="border-b px-6 py-3 text-left">{order.user?.name || 'N/A'}</td>
                <td className="border-b px-6 py-3 text-left capitalize">
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
                <td className="border-b px-6 py-3 text-left">{order.modeofPayment || 'N/A'}</td>
                <td className="border-b px-6 py-3 text-left">₱{Number(order.totalPrice).toFixed(2)}</td>
                <td className="border-b px-6 py-3 text-left">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="border-b px-6 py-3 text-left">
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 my-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
