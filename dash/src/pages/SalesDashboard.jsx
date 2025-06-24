import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Placeholder data for demonstration
const demoMetrics = {
  totalRevenue: "₱120,000",
  totalTransactions: 320,
  aov: "₱375",
  topProducts: ["Notebook", "Ballpen", "Marker"],
  salesByCategory: [
    { category: "Books", value: 50000 },
    { category: "Stationery", value: 40000 },
    { category: "Art", value: 30000 },
  ],
};

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ items: [{ book: "", quantity: 1 }] });
  const { user } = useAuth();

  // --- ORDERS ---
  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOrders(res.data);
    } catch {
      setOrders([]);
    }
  };
  const addOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/orders", orderForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setShowOrderModal(false);
      setOrderForm({ items: [{ book: "", quantity: 1 }] });
      fetchOrders();
    } catch {
      alert("Failed to add order");
    }
  };
  // Add updateOrder and deleteOrder functions here as needed

  // --- CUSTOMERS ---
  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    }
  };
  // Add addCustomer, updateCustomer, deleteCustomer functions here

  // --- LOGS ---
  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/logs", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setLogs(res.data);
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "customers") fetchCustomers();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab]);

  return (
    <div className="p-6 font-lora bg-gradient-to-br from-red-50 via-white to-red-100 min-h-screen">
      <h1 className="text-3xl font-bold text-red-700 mb-6">Sales Dashboard</h1>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        {/*
          Removed "shipping" tab
        */}
        {[
          { key: "dashboard", label: "Dashboard" },
          { key: "orders", label: "Orders" },
          { key: "customers", label: "Customers" },
          { key: "logs", label: "Logs" },
          { key: "reports", label: "Reports" },
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

      {/* 1. Key Sales Metrics / KPIs */}
      {activeTab === "dashboard" && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-500">Total Sales Revenue</div>
              <div className="text-2xl font-bold text-red-700">{demoMetrics.totalRevenue}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-500">Total Transactions</div>
              <div className="text-2xl font-bold text-red-700">{demoMetrics.totalTransactions}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-sm text-gray-500">Average Order Value</div>
              <div className="text-2xl font-bold text-red-700">{demoMetrics.aov}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">Top-Selling Products</div>
              <ul className="list-disc ml-6">
                {demoMetrics.topProducts.map((prod) => (
                  <li key={prod} className="text-red-700 font-semibold">{prod}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-2">Sales by Category</div>
              <ul>
                {demoMetrics.salesByCategory.map((cat) => (
                  <li key={cat.category} className="flex justify-between">
                    <span>{cat.category}</span>
                    <span className="font-semibold text-red-700">₱{cat.value.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 2. Sales Order Table (Full CRUD) */}
      {activeTab === "orders" && (
        <section>
          <h2 className="text-xl font-bold text-red-700 mb-4">Sales Orders</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between mb-4">
              <div className="text-gray-500">Order table goes here.</div>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => setShowOrderModal(true)}
              >
                + Add New Order
              </button>
            </div>
            <table className="min-w-full mb-4">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-red-700">Order ID</th>
                  <th className="text-left py-2 px-3 text-red-700">Customer</th>
                  <th className="text-left py-2 px-3 text-red-700">Items</th>
                  <th className="text-left py-2 px-3 text-red-700">Total</th>
                  <th className="text-left py-2 px-3 text-red-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="py-2 px-3">{order._id}</td>
                    <td className="py-2 px-3">{order.user?.name || "N/A"}</td>
                    <td className="py-2 px-3">
                      {order.items.map((item, idx) => (
                        <div key={idx}>
                          {item.book?.title || item.book} x {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="py-2 px-3">₱{order.totalPrice}</td>
                    <td className="py-2 px-3">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Modal for manual order creation */}
          {showOrderModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <form
                className="bg-white p-6 rounded shadow-lg w-full max-w-md"
                onSubmit={addOrder}
              >
                <h3 className="text-lg font-bold mb-4">Add New Order</h3>
                {/* For demo: only one item, extend as needed */}
                <input
                  type="text"
                  placeholder="Book ID"
                  value={orderForm.items[0].book}
                  onChange={e =>
                    setOrderForm(f => ({
                      ...f,
                      items: [{ ...f.items[0], book: e.target.value, quantity: f.items[0].quantity }]
                    }))
                  }
                  className="border px-3 py-2 rounded w-full mb-2"
                  required
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Quantity"
                  value={orderForm.items[0].quantity}
                  onChange={e =>
                    setOrderForm(f => ({
                      ...f,
                      items: [{ ...f.items[0], quantity: Number(e.target.value), book: f.items[0].book }]
                    }))
                  }
                  className="border px-3 py-2 rounded w-full mb-4"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 px-4 py-2 rounded"
                    onClick={() => setShowOrderModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
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