import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = axios.create({
  baseURL: 'http://192.168.9.16:5000/api',
});

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [modalOrder, setModalOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [newOrder, setNewOrder] = useState({
    user: "",
    items: [{ book: "", quantity: 1 }]
  });
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    aov: 0,
    topProducts: [],
    salesByCategory: [],
  });
  const { user } = useAuth();

  API.defaults.headers.common['Authorization'] = `Bearer ${user?.token}`;

  // Fetch all orders for sales department
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
  }, []);

  // Accept order
  const handleAccept = async (orderId) => {
    if (!window.confirm("Accept this order? This will decrease book stocks.")) return;
    setActionLoading(orderId);
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      fetchOrders();
      setModalOrder(null);
    } catch (err) {
      alert("Failed to accept order: " + (err?.response?.data?.message || err.message));
    }
    setActionLoading(false);
  };

  // Decline order
  const handleDecline = async (orderId) => {
    if (!window.confirm("Decline this order?")) return;
    setActionLoading(orderId);
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      fetchOrders();
      setModalOrder(null);
    } catch (err) {
      alert("Failed to decline order");
    }
    setActionLoading(false);
  };

  // Delete order
  const handleDeleteOrder = async (order) => {
    if (window.confirm('Delete this order?')) {
      setActionLoading(order._id);
      try {
        await API.delete(`/orders/${order._id}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        fetchOrders();
        setModalOrder(null);
      } catch (err) {
        alert('Delete failed: ' + (err?.response?.data?.message || err.message));
      }
      setActionLoading(false);
    }
  };

  // Filtering
  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    if (filter === "pending") return order.status === "pending";
    if (filter === "accepted") return order.status === "accepted";
    if (filter === "declined") return order.status === "declined";
    return true;
  });

  // Fetch users and books for the add order form
  useEffect(() => {
    if (showAddModal) {
      API.get('/users').then(res => setUsers(res.data || []));
      API.get('/books').then(res => setBooks(res.data || []));
    }
  }, [showAddModal, user]);

  // Add order handler
  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      await API.post('/orders', {
        user: newOrder.user,
        items: newOrder.items.map(i => ({ book: i.book, quantity: Number(i.quantity) }))
      });
      setShowAddModal(false);
      setNewOrder({ user: "", items: [{ book: "", quantity: 1 }] });
      fetchOrders();
      alert("Order created!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create order");
    }
  };

  // Fetch metrics for dashboard
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/orders/metrics`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setMetrics(res.data);
      } catch {
        setMetrics({
          totalRevenue: 0,
          totalTransactions: 0,
          aov: 0,
          topProducts: [],
          salesByCategory: [],
        });
      }
    };
    if (activeTab === "dashboard") fetchMetrics();
  }, [activeTab, user]);

  return (
    <div className="p-6 font-lora bg-gradient-to-br from-red-50 via-white to-red-100 min-h-screen">
      <h1 className="text-3xl font-bold text-red-700 mb-6">Sales Dashboard</h1>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        {[
          {
            key: "dashboard",
            label: "Dashboard"
          },
          {
            key: "orders",
            label: "Orders"
          },
          {
            key: "customers",
            label: "Customers"
          },
          {
            key: "logs",
            label: "Logs"
          },
          {
            key: "reports",
            label: "Reports"
          }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <section>
          <h2 className="text-xl font-bold text-red-700 mb-4">Sales Orders</h2>
          {/* Add Order Button */}
          <div className="mb-4">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => setShowAddModal(true)}
            >
              + Add Order
            </button>
          </div>
          {/* Filter choices */}
          <div className="mb-6 flex gap-4">
            <button
              className={`px-4 py-2 rounded ${filter === "all" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setFilter("all")}
            >All</button>
            <button
              className={`px-4 py-2 rounded ${filter === "pending" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setFilter("pending")}
            >Pending</button>
            <button
              className={`px-4 py-2 rounded ${filter === "accepted" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setFilter("accepted")}
            >Accepted</button>
            <button
              className={`px-4 py-2 rounded ${filter === "declined" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setFilter("declined")}
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
                      ${order.status === "paid" ? "bg-green-100 text-green-700"
                        : order.status === "pending" ? "bg-yellow-100 text-yellow-700"
                        : order.status === "accepted" ? "bg-blue-100 text-blue-700"
                        : order.status === "declined" ? "bg-gray-300 text-gray-700"
                        : "bg-gray-100 text-gray-700"}`}>
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
                              alt={item.book?.title || "Book"}
                              className="h-8 w-6 object-cover rounded shadow"
                            />
                          )}
                          <span>
                            {item.book?.title || "Book"} x {item.quantity}
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
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      onClick={() => handleDeleteOrder(order)}
                      disabled={actionLoading === order._id}
                    >
                      {actionLoading === order._id ? "Deleting..." : "Delete"}
                    </button>
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
                              alt={item.book?.title || "Book"}
                              className="h-10 w-8 object-cover rounded shadow"
                            />
                          )}
                          <span>
                            {item.book?.title || "Book"} x {item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div><span className="font-semibold">Placed:</span> {new Date(modalOrder.createdAt).toLocaleString()}</div>
                </div>
                {/* Accept/Decline buttons for pending orders */}
                {modalOrder.status === "pending" && (
                  <div className="flex gap-4 mt-6">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      onClick={() => handleAccept(modalOrder._id)}
                      disabled={actionLoading === modalOrder._id}
                    >
                      {actionLoading === modalOrder._id ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      onClick={() => handleDecline(modalOrder._id)}
                      disabled={actionLoading === modalOrder._id}
                    >
                      {actionLoading === modalOrder._id ? "Declining..." : "Decline"}
                    </button>
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
                {/* User text field instead of dropdown */}
                <div>
                  <label className="font-semibold">Customer:</label>
                  <input
                    type="text"
                    required
                    className="ml-2 border px-2 py-1 rounded w-full"
                    placeholder="Enter customer name or email"
                    value={newOrder.user}
                    onChange={e => setNewOrder(o => ({ ...o, user: e.target.value }))}
                  />
                </div>
                {/* Items */}
                <div>
                  <label className="font-semibold">Items:</label>
                  {newOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        required
                        className="border px-2 py-1 rounded flex-1"
                        value={item.book}
                        onChange={e => {
                          const items = [...newOrder.items];
                          items[idx].book = e.target.value;
                          setNewOrder(o => ({ ...o, items }));
                        }}
                      >
                        <option value="">Select book</option>
                        {books.map(b => (
                          <option key={b._id} value={b._id}>{b.title}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="border px-2 py-1 rounded w-20"
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
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
                >
                  Create Order
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* 1. Key Sales Metrics / KPIs */}
      {activeTab === "dashboard" && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-500">Total Sales Revenue</div>
              <div className="text-2xl font-bold text-red-700">
                ₱{Number(metrics.totalRevenue).toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-500">Total Transactions</div>
              <div className="text-2xl font-bold text-red-700">
                {metrics.totalTransactions}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-500">Average Order Value</div>
              <div className="text-2xl font-bold text-red-700">
                ₱{Number(metrics.aov).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">Top-Selling Products</div>
              <ul className="list-disc ml-6">
                {metrics.topProducts.map((prod) => (
                  <li key={prod} className="text-red-700 font-semibold">{prod}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">Sales by Category</div>
              <ul>
                {metrics.salesByCategory.map((cat) => (
                  <li key={cat.category} className="flex justify-between">
                    <span>{cat.category}</span>
                    <span className="font-semibold text-red-700">₱{Number(cat.value).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 3. Customer Management (Full CRUD) */}
      {activeTab === "customers" && (
        <section>
          <h2 className="text-xl font-bold text-red-700 mb-4">Customers</h2>
          <div className="bg-white rounded-lg shadow p-6">
            {/* TODO: Implement CRUD Table for Customers */}
            <div className="text-gray-500">Customer management goes here.</div>
          </div>
        </section>
      )}

      {/* 4. Sales Logs / History */}
      {activeTab === "logs" && (
        <section>
          <h2 className="text-xl font-bold text-red-700 mb-4">Sales Logs</h2>
          <div className="bg-white rounded-lg shadow p-6">
            {/* TODO: Implement Logs Table */}
            <div className="text-gray-500">Sales logs table goes here.</div>
          </div>
        </section>
      )}

      {/* 5. Reports & Visuals */}
      {activeTab === "reports" && (
        <section>
          <h2 className="text-xl font-bold text-red-700 mb-4">Reports & Visuals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <div className="text-gray-500 mb-2">Sales Trends</div>
              {/* TODO: Insert line chart */}
              <div className="w-full h-40 bg-red-50 rounded flex items-center justify-center text-red-300">[Line Chart]</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <div className="text-gray-500 mb-2">Top Products</div>
              {/* TODO: Insert bar chart */}
              <div className="w-full h-40 bg-red-50 rounded flex items-center justify-center text-red-300">[Bar Chart]</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <div className="text-gray-500 mb-2">Orders by Category</div>
              {/* TODO: Insert pie chart */}
              <div className="w-full h-40 bg-red-50 rounded flex items-center justify-center text-red-300">[Pie Chart]</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SalesDashboard;