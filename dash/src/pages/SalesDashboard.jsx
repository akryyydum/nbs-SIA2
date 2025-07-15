import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

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
    items: [{ book: "", quantity: 1 }],
    modeofPayment: "Cash"
  });
  const [logs, setLogs] = useState([]);
  const [nameError, setNameError] = useState("");
  const [bankError, setBankError] = useState(""); // <-- Add this line
  const [bankNumber, setBankNumber] = useState("");
  const { user } = useAuth();

  // Dashboard visuals state (like Inventory)
  // Removed TopProductsBar and OrdersByCategory state
   const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [aov, setAov] = useState(0);
  const [topBooksData, setTopBooksData] = useState([]);
  const [categoryChartData, setCategoryChartData] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [dashboardPage, setDashboardPage] = useState(1);
  const ordersPerPage = 5;

  // API instance (like Inventory)
  const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://192.168.9.16:5000/api",
    headers: { Authorization: `Bearer ${user?.token}` }
  });

  // Fetch all orders for sales department
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders');
      setOrders(res.data);

      // Revenue/transactions logic (same as Orders.jsx):
      // - Bank: status is "paid"
      // - Cash: always include (regardless of status)
      // - COD: status is "received"
      const acceptedOrPaidOrders = res.data.filter(order => {
        if (order.modeofPayment === "Bank Transfer" || order.modeofPayment === "bank") {
          return order.status === "paid";
        }
        if (order.modeofPayment === "Cash") {
          return true; // Always count cash orders
        }
        if (
          order.modeofPayment === "Cash on Delivery" ||
          order.modeofPayment === "cod"
        ) {
          return order.status === "received";
        }
        return false;
      });

      // Only use acceptedOrPaidOrders for metrics (like Orders.jsx)
      const revenue = acceptedOrPaidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const transactions = acceptedOrPaidOrders.length;
      const avgOrderValue = transactions > 0 ? revenue / transactions : 0;
      setTotalRevenue(revenue);
      setTotalTransactions(transactions);
      setAov(avgOrderValue);

      // Top books and category chart: use acceptedOrPaidOrders for stats
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
    } catch (err) {
      alert('Failed to fetch orders');
      setTotalRevenue(0);
      setTotalTransactions(0);
      setAov(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // Accept order
  const handleAccept = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!window.confirm("Accept this order? This will decrease book stocks.")) return;
    setActionLoading(orderId);
    try {
      await API.put(`/orders/${orderId}/accept`, {});
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
      await API.put(`/orders/${orderId}/decline`, {});
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
    if (filter === "shipped") return order.status === "out for delivery" || order.status === "shipped";
    if (filter === "delivered") return order.status === "delivered" || order.status === "received";
    return true;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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
    if (!isValidName(newOrder.user)) {
      setNameError("Only letters and spaces are allowed, and at least one letter is required.");
      return;
    }
    if (newOrder.modeofPayment === "Bank") {
      if (!bankNumber.trim()) {
        setBankError("Bank number is required for bank payments.");
        return;
      }
      if (!isValidBankNumber(bankNumber.trim())) {
        setBankError("Bank number can only contain numbers and dashes.");
        return;
      }
    }
    try {
      const orderData = {
        user: newOrder.user,
        items: newOrder.items.map(i => ({ book: i.book, quantity: Number(i.quantity) })),
        modeofPayment: newOrder.modeofPayment,
        ...(newOrder.modeofPayment === "Bank" && { bankNumber: bankNumber.trim() })
      };
      await API.post('/orders', orderData);
      setShowAddModal(false);
      setNewOrder({ user: "", items: [{ book: "", quantity: 1 }], modeofPayment: "Cash" });
      setBankNumber("");
      fetchOrders();
      alert("Order created!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create order");
    }
  };

  // Fetch logs for sales activity
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get('/orders/logs');
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };
    if (activeTab === "logs") fetchLogs();
  }, [activeTab, user]);

  // Filter out supplier orders for the customer view
  const customerOrders = useMemo(
    () => orders.filter(order =>
      !order.isSupplierOrder && order.modeofPayment !== 'Supplier Order'
    ),
    [orders]
  );

  // Dashboard metrics recalculation when customerOrders changes
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

    // Top books and category chart logic
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

  const isValidName = (name) =>
  /^[A-Za-z\s]+$/.test(name) && /[A-Za-z]/.test(name);

  const isValidBankNumber = (value) => /^[0-9-]+$/.test(value);

  return (
    <div className="p-6 font-lora bg-gradient-to-br from-red-50 via-white to-red-100 min-h-screen">
      <h1 className="text-3xl font-bold text-red-700 mb-6">Sales Dashboard</h1>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        {[
          { key: "dashboard", label: "Dashboard" },
          { key: "orders", label: "Orders" }
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

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <section>
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

          {/* Recent Orders - Only in Dashboard */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="text-gray-500 mb-2 font-semibold text-lg">Recent Orders</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Order ID</th>
                    <th className="py-2 px-4 text-left">Customer</th>
                    <th className="py-2 px-4 text-left">Total</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .slice()
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map(order => (
                      <tr key={order._id} className="border-b text-base">
                        <td className="py-2 px-4">{order._id}</td>
                        <td className="py-2 px-4">{order.user?.name || order.user || "N/A"}</td>
                        <td className="py-2 px-4">₱{Number(order.totalPrice).toFixed(2)}</td>
                        <td className="py-2 px-4">
                          <span className={`px-3 py-1 rounded-full text-base font-medium
                            ${order.status === "paid" ? "bg-green-100 text-green-700"
                              : order.status === "pending" ? "bg-yellow-100 text-yellow-700"
                              : order.status === "accepted" ? "bg-blue-100 text-blue-700"
                              : order.status === "declined" ? "bg-gray-300 text-gray-700"
                              : "bg-gray-100 text-gray-700"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2 px-4">{new Date(order.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls removed for recent orders */}
          </div>
        </section>
      )}

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
              className={`px-4 py-2 rounded ${filter === "shipped" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setFilter("shipped")}
            >Shipped</button>
            <button
              className={`px-4 py-2 rounded ${filter === "delivered" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setFilter("delivered")}
            >Delivered</button>
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
            <>
              <div className="space-y-6">
                {currentOrders.map(order => (
                  <div key={order._id} className="border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold">Order ID:</span> {order._id}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${order.status === "paid" ? "bg-green-100 text-green-700"
                          : order.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : order.status === "accepted" ? "bg-blue-100 text-blue-700"
                          : order.status === "out for delivery" ? "bg-blue-100 text-blue-700"
                          : order.status === "received" ? "bg-green-200 text-green-800"
                          : order.status === "delivered" ? "bg-green-300 text-green-900"
                          : order.status === "declined" ? "bg-gray-300 text-gray-700"
                          : "bg-gray-100 text-gray-700"}`}>
                        {order.status === "out for delivery"
                          ? "shipped"
                          : order.status === "received"
                            ? "received"
                            : order.status === "delivered"
                              ? "delivered"
                              : order.status}
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
                      {/* Ship button for accepted orders */}
                      {order.status === "accepted" && (
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          onClick={async () => {
                            if (!window.confirm('Mark this order as shipped?')) return;
                            setActionLoading(order._id);
                            try {
                              await API.put(`/orders/${order._id}/ship`, {});
                              fetchOrders();
                            } catch (err) {
                              alert('Failed to mark as shipped: ' + (err?.response?.data?.message || err.message));
                            }
                            setActionLoading(false);
                          }}
                          disabled={actionLoading === order._id}
                        >
                          {actionLoading === order._id ? "Shipping..." : "Ship"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      className={`px-3 py-1 rounded ${currentPage === idx + 1 ? "bg-red-600 text-white" : "bg-gray-200"}`}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 rounded bg-gray-200"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
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
                  <div>
                    <span className="font-semibold">Customer:</span>{" "}
                    {modalOrder.user?.name || modalOrder.user?.email || modalOrder.user || "N/A"}
                  </div>
                  <div><span className="font-semibold">Status:</span> {modalOrder.status}</div>
                  <div><span className="font-semibold">Mode of Payment:</span> {modalOrder.modeofPayment}</div>
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
                    placeholder="Enter customer name"
                    value={newOrder.user}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === "" || isValidName(value)) {
                        setNewOrder(o => ({ ...o, user: value }));
                        setNameError("");
                      } else {
                        setNameError("Only letters and spaces are allowed, and at least one letter is required.");
                      }
                    }}
                  />
                  {nameError && (
                    <div className="text-red-600 text-sm mt-1">{nameError}</div>
                  )}
                </div>
                {/* Mode of Payment - fixed as Cash */}
                <div>
                  <label className="font-semibold">Mode of Payment:</label>
                  <select
                    className="ml-2 border px-2 py-1 rounded w-full"
                    value={newOrder.modeofPayment}
                    onChange={e => {
                      setNewOrder(o => ({ ...o, modeofPayment: e.target.value }));
                      setBankNumber("");
                    }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                {newOrder.modeofPayment === "Bank" && (
                  <div>
                    <label className="font-semibold">Bank Number:</label>
                    <input
                      type="text"
                      required
                      className="ml-2 border px-2 py-1 rounded w-full"
                      placeholder="Enter bank number"
                      value={bankNumber}
                      onChange={e => {
                        const value = e.target.value;
                        if (value === "" || isValidBankNumber(value)) {
                          setBankNumber(value);
                          setBankError("");
                        } else {
                          setBankError("Bank number can only contain numbers and dashes.");
                        }
                      }}
                    />
                    {bankError && (
                      <div className="text-red-600 text-sm mt-1">{bankError}</div>
                    )}
                  </div>
                )}
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
    </div>
  );
};

export default SalesDashboard;