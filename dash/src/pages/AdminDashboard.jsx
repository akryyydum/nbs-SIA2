import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

// API base URL (use proxy, so keep /api)
const API_BASE = "/api";

// Chart color palettes
const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#A78BFA",
  "#F472B6",
  "#FBBF24",
  "#34D399",
  "#F87171",
  "#60A5FA",
];

// Helper for auth headers
const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    totalSales: 0,
    supplierLogins: [],
    stockByCategory: {},
    salesTrends: {},
    topBooks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    (async () => {
      try {
        const [booksRes, usersRes, suppliersRes, ordersRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE}/books`, authHeader(user.token)),
          axios.get(`${API_BASE}/users`, authHeader(user.token)),
          axios.get(`${API_BASE}/suppliers`, authHeader(user.token)),
          axios.get(`${API_BASE}/orders`, authHeader(user.token)),
          axios.get(`${API_BASE}/logs/supplier-logins`, authHeader(user.token)).catch(() => ({ data: [] })),
        ]);
        const books = booksRes.data || [];
        const users = usersRes.data || [];
        const suppliers = suppliersRes.data || [];
        const orders = ordersRes.data || [];
        const supplierLogins = logsRes.data || [];

        // Calculate statistics
        const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        // Stock by category
        const stockByCategory = {};
        books.forEach((b) => {
          if (!b.category) return;
          stockByCategory[b.category] = (stockByCategory[b.category] || 0) + (Number(b.stock) || 0);
        });

        // Sales trends (by month)
        const salesTrends = {};
        orders.forEach((order) => {
          if (!order.createdAt) return;
          const date = new Date(order.createdAt);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          salesTrends[month] = (salesTrends[month] || 0) + (order.totalPrice || 0);
        });

        // Top books by sales
        const bookSales = {};
        orders.forEach((order) => {
          (order.items || []).forEach((item) => {
            const bookId = item.book?._id || item.book;
            if (!bookId) return;
            bookSales[bookId] = (bookSales[bookId] || 0) + (item.quantity || 0);
          });
        });
        const topBooks = books
          .map((b) => ({
            title: b.title,
            sales: bookSales[b._id] || 0,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10);

        setStats({
          totalBooks: books.length,
          totalUsers: users.length,
          totalSuppliers: suppliers.length,
          totalOrders: orders.length,
          totalSales,
          supplierLogins,
          stockByCategory,
          salesTrends,
          topBooks,
        });
      } catch {
        setStats((s) => ({ ...s }));
      }
      setLoading(false);
    })();
  }, [user]);

  // Chart data
  const stockByCategoryData = {
    labels: Object.keys(stats.stockByCategory),
    datasets: [
      {
        data: Object.values(stats.stockByCategory),
        backgroundColor: COLORS,
      },
    ],
  };

  const salesTrendsMonths = Object.keys(stats.salesTrends).sort();
  const salesTrendsData = {
    labels: salesTrendsMonths,
    datasets: [
      {
        label: "Sales",
        data: salesTrendsMonths.map((m) => stats.salesTrends[m]),
        fill: false,
        borderColor: COLORS[1],
        backgroundColor: COLORS[1],
        tension: 0.3,
      },
    ],
  };

  const topBooksData = {
    labels: stats.topBooks.map((b) => b.title),
    datasets: [
      {
        label: "Units Sold",
        data: stats.topBooks.map((b) => b.sales),
        backgroundColor: COLORS,
      },
    ],
  };

  // Supplier logins per day
  const supplierLoginCounts = {};
  (stats.supplierLogins || []).forEach((log) => {
    const date = log.timestamp ? log.timestamp.slice(0, 10) : "Unknown";
    supplierLoginCounts[date] = (supplierLoginCounts[date] || 0) + 1;
  });
  const supplierLoginDates = Object.keys(supplierLoginCounts).sort();
  const supplierLoginsData = {
    labels: supplierLoginDates,
    datasets: [
      {
        label: "Supplier Logins",
        data: supplierLoginDates.map((d) => supplierLoginCounts[d]),
        backgroundColor: COLORS[6],
        borderColor: "#F59E42",
        fill: true,
      },
    ],
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 font-lora">
      <h1 className="text-3xl font-bold text-red-700 mb-8">Admin Dashboard</h1>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading statistics...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KpiCard label="Total Books" value={stats.totalBooks} />
            <KpiCard label="Total Users" value={stats.totalUsers} />
            <KpiCard label="Total Suppliers" value={stats.totalSuppliers} />
            <KpiCard label="Total Orders" value={stats.totalOrders} />
          </div>
          {/* Sales and Stock Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <ChartCard title="Stock by Category">
              <Pie data={stockByCategoryData} />
            </ChartCard>
            <ChartCard title="Sales Trends">
              <Line data={salesTrendsData} />
            </ChartCard>
            <ChartCard title="Top Selling Books">
              <Bar data={topBooksData} />
            </ChartCard>
          </div>
          {/* Supplier Logins */}
          <ChartCard title="Supplier Logins (per day)" className="mb-8">
            <Line data={supplierLoginsData} />
          </ChartCard>
          {/* Total Sales */}
          <ChartCard title="Total Sales" className="mb-8">
            <div className="text-3xl font-bold text-green-700">
              ₱{Number(stats.totalSales).toLocaleString()}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
};

// KPI Card component
function KpiCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-red-700">{value}</div>
    </div>
  );
}

// Chart Card component
function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

export default AdminDashboard;
