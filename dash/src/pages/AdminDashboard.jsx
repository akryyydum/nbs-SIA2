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
import { FaBook, FaUsers, FaTruck, FaShoppingCart, FaChartPie, FaChartLine, FaCrown, FaUserClock, FaMoneyBillWave } from "react-icons/fa";

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

const API_BASE = 'http://192.168.9.16:5173/api';

const ICONS = [
  <FaBook className="text-3xl text-red-400" />,
  <FaUsers className="text-3xl text-blue-400" />,
  <FaTruck className="text-3xl text-green-400" />,
  <FaShoppingCart className="text-3xl text-yellow-400" />,
];

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
    salesTrends: [],
    topBooks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // You should implement these endpoints in your backend for real data
        const [booksRes, usersRes, suppliersRes, ordersRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE}/books`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/suppliers`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/logs/supplier-logins`, { headers: { Authorization: `Bearer ${user?.token}` } }).catch(() => ({ data: [] })),
        ]);
        const books = booksRes.data || [];
        const users = usersRes.data || [];
        const suppliers = suppliersRes.data || [];
        const orders = ordersRes.data || [];
        const supplierLogins = logsRes.data || [];

        // Calculate statistics
        const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
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
      } catch (err) {
        // fallback to empty stats
        setStats((s) => ({ ...s }));
      }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  // Chart data
  const stockByCategoryData = {
    labels: Object.keys(stats.stockByCategory),
    datasets: [
      {
        data: Object.values(stats.stockByCategory),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#A78BFA",
          "#F472B6",
          "#FBBF24",
          "#34D399",
        ],
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
        borderColor: "#36A2EB",
        backgroundColor: "#36A2EB",
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
        backgroundColor: [
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
        ],
      },
    ],
  };

  // Supplier logins per day (if available)
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
        backgroundColor: "#FBBF24",
        borderColor: "#F59E42",
        fill: true,
      },
    ],
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 font-poppins">
      <h1 className="text-3xl font-bold text-red-700 mb-8 flex items-center gap-3 animate-fade-in-down">
        <FaChartPie className="text-red-500" /> Admin Dashboard
      </h1>
      {loading ? (
        <div className="text-center text-gray-500 py-8 animate-pulse">Loading statistics...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KpiCard label="Total Books" value={stats.totalBooks} icon={ICONS[0]} />
            <KpiCard label="Total Users" value={stats.totalUsers} icon={ICONS[1]} />
            <KpiCard label="Total Suppliers" value={stats.totalSuppliers} icon={ICONS[2]} />
            <KpiCard label="Total Orders" value={stats.totalOrders} icon={ICONS[3]} />
          </div>
          {/* Sales and Stock Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <ChartCard title="Stock by Category" icon={<FaChartPie className="text-xl text-pink-400" />}>
              <Pie data={stockByCategoryData} className="animate-fade-in" />
            </ChartCard>
            <ChartCard title="Sales Trends" icon={<FaChartLine className="text-xl text-blue-400" />}>
              <Line data={salesTrendsData} className="animate-fade-in" />
            </ChartCard>
            <ChartCard title="Top Selling Books" icon={<FaCrown className="text-xl text-yellow-400" />}>
              <Bar data={topBooksData} className="animate-fade-in" />
            </ChartCard>
          </div>
          {/* Supplier Logins */}
          <ChartCard title="Supplier Logins (per day)" icon={<FaUserClock className="text-xl text-green-400" />} className="mb-8">
            <Line data={supplierLoginsData} className="animate-fade-in" />
          </ChartCard>
          {/* Total Sales */}
          <ChartCard title="Total Sales" icon={<FaMoneyBillWave className="text-xl text-green-600" />} className="mb-8">
            <div className="text-3xl font-bold text-green-700 animate-fade-in">
              ₱{Number(stats.totalSales).toLocaleString()}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
};

// KPI Card component with icon, animation, and hover effect
function KpiCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 flex flex-col items-center gap-2 animate-fade-in-up transition-all duration-500 hover:scale-105 hover:shadow-xl hover:border-red-700 cursor-pointer">
      <div>{icon}</div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-red-700">{value}</div>
    </div>
  );
}

// Chart Card component with icon, animation, and hover effect
function ChartCard({ title, icon, children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className} animate-fade-in transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer`}>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-semibold">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

// Tailwind CSS custom animation classes (add to your global CSS if not present)
/*
@layer utilities {
  .animate-fade-in { animation: fadeIn 0.7s ease; }
  .animate-fade-in-up { animation: fadeInUp 0.7s ease; }
  .animate-fade-in-down { animation: fadeInDown 0.7s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1; transform: translateY(0);} }
}
*/

export default AdminDashboard;
