import { useEffect, useState } from "react";
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
import { FaBook, FaUsers, FaTruck, FaShoppingCart, FaChartPie, FaChartLine, FaCrown, FaMoneyBillWave } from "react-icons/fa";

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

const API_BASE = 'https://nbs-sia2.onrender.com/api';

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
    customerLogins: [], // changed from supplierLogins
    stockByCategory: {},
    salesTrends: [],
    topBooks: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierUsers, setSupplierUsers] = useState([]);

  // Export data as CSV
  const handleExportData = () => {
    // Prepare CSV rows
    const rows = [
      ['Order ID', 'Customer', 'Total', 'Status', 'Date'],
      ...(stats.orders || []).map(order => [
        order._id,
        order.user?.name || order.user || "N/A",
        Number(order.totalPrice).toFixed(2),
        order.status,
        new Date(order.createdAt).toLocaleString()
      ])
    ];
    // Convert to CSV string
    const csvContent = rows.map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [booksRes, usersRes, suppliersRes, ordersRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE}/books`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/suppliers`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${user?.token}` } }),
          axios.get(`${API_BASE}/logs/customer-logins`, { headers: { Authorization: `Bearer ${user?.token}` } }).catch(() => ({ data: [] }))
        );
        const books = booksRes.data || [];
        const users = usersRes.data || [];
        const suppliers = suppliersRes.data || [];
        const supplierUsers = users.filter(u => u.role === 'supplier department');
        const orders = ordersRes.data || [];
        const customerLogins = logsRes.data || [];

        const allSuppliers = [
          ...suppliers,
          ...supplierUsers.map(u => ({
            _id: u._id,
            companyName: u.name || u.email || u._id,
            contactPerson: u.name || '',
            email: u.email,
            phone: u.phone || '',
            address: u.address || '',
            productCategories: [],
            status: u.status || 'active',
            _type: 'User',
            userObj: u,
            books: [],
            createdAt: u.createdAt || u.registrationDate || new Date().toISOString(),
          }))
        ];
        const totalSuppliers = allSuppliers.length;

        // Filter out supplier orders
        const customerOrders = orders.filter(
          o => !o.isSupplierOrder && o.modeofPayment !== 'Supplier Order'
        );

        // Calculate statistics using only customerOrders
        // --- Use SalesDashboard.jsx logic for total sales ---
        const totalSales = customerOrders.reduce((sum, o) => {
          if (
            (o.modeofPayment === "Cash on Delivery" || o.modeofPayment === "cod") &&
            o.status === "received"
          ) {
            return sum + (o.totalPrice || 0);
          }
          if (
            (o.modeofPayment === "Bank" ||
              o.modeofPayment === "Bank Transfer" ||
              o.modeofPayment === "bank")
          ) {
            return sum + (o.totalPrice || 0);
          }
          if (
            o.modeofPayment === "Cash" &&
            (o.status === "accepted" || o.status === "received")
          ) {
            return sum + (o.totalPrice || 0);
          }
          return sum;
        }, 0);

        const stockByCategory = {};
        books.forEach((b) => {
          if (!b.category) return;
          stockByCategory[b.category] = (stockByCategory[b.category] || 0) + (Number(b.stock) || 0);
        });

        // Top books by sales (copied from SalesDashboard.jsx logic)
        const bookSalesMap = {};
        const acceptedOrPaidOrders = customerOrders.filter(order => {
          if (
            order.modeofPayment === "Bank" ||
            order.modeofPayment === "Bank Transfer" ||
            order.modeofPayment === "bank"
          ) {
            return true;
          }
          if (
            order.modeofPayment === "Cash on Delivery" ||
            order.modeofPayment === "cod"
          ) {
            return order.status === "received";
          }
          if (order.modeofPayment === "Cash") {
            return order.status === "accepted" || order.status === "received";
          }
          return false;
        });

        // Sales per day - use only accepted/paid/received customer orders
        const salesPerDay = {};
        const transactionsPerDay = {};
        const transactionsPerWeek = {};
        const transactionsPerMonth = {};

        acceptedOrPaidOrders.forEach((order) => {
          if (!order.createdAt) return;
          const dateObj = new Date(order.createdAt);
          const dateStr = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
          // Week string: YYYY-WW (ISO week)
          const weekNumber = Math.ceil(
            (dateObj.getDate() - dateObj.getDay() + 1) / 7
          );
          const weekStr = `${dateObj.getFullYear()}-W${weekNumber
            .toString()
            .padStart(2, "0")}`;
          // Month string: YYYY-MM
          const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

          salesPerDay[dateStr] = (salesPerDay[dateStr] || 0) + (order.totalPrice || 0);
          transactionsPerDay[dateStr] = (transactionsPerDay[dateStr] || 0) + 1;
          transactionsPerWeek[weekStr] = (transactionsPerWeek[weekStr] || 0) + 1;
          transactionsPerMonth[monthStr] = (transactionsPerMonth[monthStr] || 0) + 1;
        });

        acceptedOrPaidOrders.forEach(order => {
          order.items.forEach(item => {
            const bookTitle = item.book?.title || 'Unknown';
            bookSalesMap[bookTitle] = (bookSalesMap[bookTitle] || 0) + item.quantity;
          });
        });
        const topBooks = Object.entries(bookSalesMap)
          .map(([title, quantity]) => ({ title, sales: quantity }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);

        setStats({
          totalBooks: books.length,
          totalUsers: users.length,
          totalSuppliers: totalSuppliers, // FIX: assign totalSuppliers from KPI
          totalOrders: customerOrders.length, // FIX: assign totalOrders from filtered customerOrders
          totalSales,
          customerLogins,
          stockByCategory,
          salesTrends: salesPerDay,
          transactionsPerDay,
          transactionsPerWeek,
          transactionsPerMonth,
          topBooks,
          orders: customerOrders,
        });
      } catch (err) {
        setStats((s) => ({ ...s }));
      }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const [suppliersRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/suppliers`, { headers: { Authorization: `Bearer ${user?.token}` } }),
        axios.get(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${user?.token}` } }),
      ]);
      setSuppliers(suppliersRes.data || []);
      setSupplierUsers((usersRes.data || []).filter(u => u.role === 'supplier department'));
    };
    fetchSuppliers();
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

  const salesPerDayDates = Object.keys(stats.salesTrends).sort();
  const salesPerDayData = {
    labels: salesPerDayDates,
    datasets: [
      {
        label: "Sales Per Day",
        data: salesPerDayDates.map((d) => stats.salesTrends[d]),
        fill: false,
        borderColor: "#36A2EB",
        backgroundColor: "#36A2EB",
        tension: 0.3,
      },
    ],
  };

  const transactionsPerDayDates = Object.keys(stats.transactionsPerDay || {}).sort();
  const transactionsPerDayData = {
    labels: transactionsPerDayDates,
    datasets: [
      {
        label: "Transactions Per Day",
        data: transactionsPerDayDates.map((d) => stats.transactionsPerDay[d]),
        fill: false,
        borderColor: "#F59E42",
        backgroundColor: "#FBBF24",
        tension: 0.3,
      },
    ],
  };

  const transactionsPerWeekLabels = Object.keys(stats.transactionsPerWeek || {}).sort();
  const transactionsPerWeekData = {
    labels: transactionsPerWeekLabels,
    datasets: [
      {
        label: "Transactions Per Week",
        data: transactionsPerWeekLabels.map((w) => stats.transactionsPerWeek[w]),
        fill: false,
        borderColor: "#A78BFA",
        backgroundColor: "#A78BFA",
        tension: 0.3,
      },
    ],
  };

  const transactionsPerMonthLabels = Object.keys(stats.transactionsPerMonth || {}).sort();
  const transactionsPerMonthData = {
    labels: transactionsPerMonthLabels,
    datasets: [
      {
        label: "Transactions Per Month",
        data: transactionsPerMonthLabels.map((m) => stats.transactionsPerMonth[m]),
        fill: false,
        borderColor: "#34D399",
        backgroundColor: "#34D399",
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

  // Fix: define graphCardStyle before usage in render
  const graphCardStyle =
    "bg-white rounded-2xl shadow-lg p-6 border border-red-100 mb-8 transition-all duration-300 hover:shadow-2xl";

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 font-poppins">
      <h1 className="text-3xl font-bold text-red-700 mb-8 flex items-center gap-3 animate-fade-in-down">
        <FaChartPie className="text-red-500" /> Admin Dashboard
      </h1>
      {/* Export Data Button */}
      <div className="mb-6 flex justify-end">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow transition"
          onClick={handleExportData}
        >
          Export Orders CSV
        </button>
      </div>
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
            <div className={graphCardStyle}>
              <div className="flex items-center gap-2 text-lg font-bold text-pink-400 mb-4">
                <FaChartPie className="text-xl" /> Stock by Category
              </div>
              <Pie data={stockByCategoryData} />
            </div>
            <div className={graphCardStyle}>
              <div className="flex items-center gap-2 text-lg font-bold text-blue-400 mb-4">
                <FaChartLine className="text-xl" /> Sales Per Day
              </div>
              <Line data={salesPerDayData} />
            </div>
            <div className={graphCardStyle}>
              <div className="flex items-center gap-2 text-lg font-bold text-yellow-400 mb-4">
                <FaCrown className="text-xl" /> Top Selling Books
              </div>
              <Bar data={topBooksData} />
            </div>
          </div>
          {/* Transactions Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className={graphCardStyle}>
              <div className="flex items-center gap-2 text-lg font-bold text-orange-400 mb-4">
                <FaChartLine className="text-xl" /> Transactions Per Day
              </div>
              <Line data={transactionsPerDayData} />
            </div>
            <div className={graphCardStyle}>
              <div className="flex items-center gap-2 text-lg font-bold text-purple-400 mb-4">
                <FaChartLine className="text-xl" /> Transactions Per Week
              </div>
              <Line data={transactionsPerWeekData} />
            </div>
            <div className={graphCardStyle}>
              <div className="flex items-center gap-2 text-lg font-bold text-green-400 mb-4">
                <FaChartLine className="text-xl" /> Transactions Per Month
              </div>
              <Line data={transactionsPerMonthData} />
            </div>
          </div>
          {/* Total Sales */}
          <div className={graphCardStyle}>
            <div className="flex items-center gap-2 text-lg font-bold text-green-600 mb-4">
              <FaMoneyBillWave className="text-xl" /> Total Sales
            </div>
            <div className="text-3xl font-bold text-green-700">
              ₱{Number(stats.totalSales).toLocaleString()}
            </div>
          </div>
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
// Chart Card component with icon, animation, and hover effect
// (Unused, so removed to fix unused declaration error)
// Tailwind CSS custom animation classes (add to your global CSS if not present)
/*
@layer utilities {
  .animate-fade-in { animation: fadeIn 0.7s ease; }
  .animate-fade-in-up { animation: fadeInUp 0.7s ease; }
  .animate-fade-in-down { animation: fadeInDown 0.7s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity: 1, transform: translateY(0);} }
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1, transform: translateY(0);} }
}
*/

export default AdminDashboard;
