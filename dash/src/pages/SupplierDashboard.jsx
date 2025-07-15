import React, { useEffect, useState } from 'react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  getSupplierLogs,
  getSupplierKPIs,
  getBooksBySupplier
} from '../api/supplier';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// Chart.js imports
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const SupplierDashboard = () => {
  // State placeholders
  const [suppliers, setSuppliers] = useState([]);
  const [supplierUsers, setSupplierUsers] = useState([]); // NEW: users with role 'supplier department'
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [kpis, setKpis] = useState({});
  const [products, setProducts] = useState([]);
  const [booksModal, setBooksModal] = useState({ open: false, books: [], supplier: null });
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    price: '',
    category: '',
    description: '',
    image: '',
    stock: 0,
  });

  const { user } = useAuth();

  // Helper to fetch KPIs
  const fetchKpis = async (config) => {
    const res = await getSupplierKPIs(config);
    setKpis(res.data);
  };

  // Helper to fetch suppliers and KPIs together
  const fetchSuppliersAndKpis = async (config) => {
    const [suppliersRes, kpisRes] = await Promise.all([
      getSuppliers(config),
      getSupplierKPIs(config)
    ]);
    setSuppliers(suppliersRes.data);
    setKpis(kpisRes.data);
  };

  // Fetch data (with auth)
  useEffect(() => {
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    fetchSuppliersAndKpis(config);
    // Fetch users with role 'supplier department'
    axios.get('/api/users', config)
      .then(res => {
        const users = (res.data || []).filter(u => u.role === 'supplier department');
        setSupplierUsers(users);
      })
      .catch(() => setSupplierUsers([]));
  }, [user]);

  // Fetch books for each supplier and attach to supplier object for KPI calculation
  const [suppliersWithBooks, setSuppliersWithBooks] = useState([]);

  useEffect(() => {
    async function fetchBooksForSuppliers() {
      const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
      const suppliersList = [...suppliers];
      const promises = suppliersList.map(async (supplier) => {
        try {
          const res = await getBooksBySupplier(supplier._id, config);
          return { ...supplier, books: res.data };
        } catch {
          return { ...supplier, books: [] };
        }
      });
      const results = await Promise.all(promises);
      setSuppliersWithBooks(results);
    }
    if (suppliers.length > 0) {
      fetchBooksForSuppliers();
    }
  }, [suppliers, user]);

  // Merge suppliersWithBooks and supplierUsers for table and KPIs
  const allSuppliers = [
    ...suppliersWithBooks.map(s => ({ ...s, _type: 'Supplier' })),
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
      books: [], // Users don't have books
      createdAt: u.createdAt || u.registrationDate || new Date().toISOString(), // Ensure createdAt exists
    }))
  ];

  // Calculate KPIs from allSuppliers
  const totalSuppliers = allSuppliers.length;
  const activeSuppliers = allSuppliers.filter(s => s.status === 'active').length;
  const inactiveSuppliers = allSuppliers.filter(s => s.status === 'inactive').length;

  // Most used supplier: the one with the most ordered books (basis: books array)
  let mostUsedSupplier = '--';
  let maxBooks = 0;
  allSuppliers.forEach(s => {
    const booksCount = Array.isArray(s.books) ? s.books.length : 0;
    if (booksCount > maxBooks) {
      maxBooks = booksCount;
      mostUsedSupplier = s.companyName;
    }
  });
  if (maxBooks === 0) {
    mostUsedSupplier = '--';
  }

  // New suppliers this month (createdAt must be present in supplier/user objects)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const newSuppliersThisMonth = allSuppliers.filter(s => {
    if (!s.createdAt) return false;
    return new Date(s.createdAt) >= startOfMonth;
  }).length;

  // Table and cell styles for consistency
  const tableStyles = {
    textAlign: 'center',
    borderCollapse: 'collapse',
    width: '100%',
  };
  const cellStyles = {
    textAlign: 'center',
    padding: '8px',
    border: '1px solid #ddd',
  };

  // Chart Data (use calculated KPIs from allSuppliers)
  const pieData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [activeSuppliers, inactiveSuppliers],
        backgroundColor: ['#dc2626', '#fbbf24'],
        hoverBackgroundColor: ['#b91c1c', '#f59e42'],
      },
    ],
  };

  // Dynamically generate months for the current year
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // Show up to current month
  const months = monthNames.slice(0, currentMonth + 1);
  const suppliersPerMonth = months.map((month, idx) => {
    return allSuppliers.filter(s => {
      if (!s.createdAt) return false;
      const created = new Date(s.createdAt);
      return created.getMonth() === idx && created.getFullYear() === currentYear && (s._type === 'Supplier' || s._type === 'User');
    }).length;
  });

  const barData = {
    labels: months,
    datasets: [
      {
        label: 'New Suppliers',
        data: suppliersPerMonth,
        backgroundColor: '#dc2626',
      },
    ],
  };

  // Handlers for CRUD
  const handleAdd = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
      try {
        await deleteSupplier(id, config);
        fetchSuppliersAndKpis(config);
      } catch (err) {
        alert('Failed to delete supplier: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleViewBooks = (supplier) => {
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    getBooksBySupplier(supplier._id, config)
      .then(res => {
        setBooksModal({ open: true, books: res.data, supplier });
      })
      .catch(() => {
        setBooksModal({ open: true, books: [], supplier });
      });
  };

  const handleAddBook = (supplier) => {
    setSelectedSupplier(supplier);
    setShowBookModal(true);
  };

  const handleBookFormChange = (e) => {
    const { name, value } = e.target;
    
    // Validate numeric inputs to prevent negative values
    if (name === 'price') {
      // Allow empty string or only positive numbers (including decimals)
      if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
        setBookForm(prev => ({
          ...prev,
          [name]: value,
        }));
      }
      // Reject any negative values or invalid input
    } else if (name === 'stock') {
      // Allow empty string or only non-negative integers
      if (value === '' || (!isNaN(value) && parseInt(value) >= 0 && Number.isInteger(parseFloat(value)))) {
        setBookForm(prev => ({
          ...prev,
          [name]: value,
        }));
      }
      // Reject any negative values or decimal numbers for stock
    } else {
      setBookForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!bookForm.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!bookForm.author.trim()) {
      alert('Author is required');
      return;
    }
    
    // Validate price and stock
    const price = parseFloat(bookForm.price);
    const stock = parseInt(bookForm.stock, 10);
    
    // Price validation
    if (!bookForm.price || bookForm.price === '') {
      alert('Price is required');
      return;
    }
    
    if (isNaN(price)) {
      alert('Please enter a valid price');
      return;
    }
    
    if (price < 0) {
      alert('Price cannot be negative');
      return;
    }
    
    if (price === 0) {
      alert('Price must be greater than 0');
      return;
    }
    
    // Stock validation
    if (bookForm.stock === '' || bookForm.stock === null || bookForm.stock === undefined) {
      alert('Stock is required');
      return;
    }
    
    if (isNaN(stock)) {
      alert('Please enter a valid stock number');
      return;
    }
    
    if (stock < 0) {
      alert('Stock cannot be negative');
      return;
    }
    
    // Check if stock is not an integer
    if (!Number.isInteger(stock)) {
      alert('Stock must be a whole number');
      return;
    }
    
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    const bookData = {
      title: bookForm.title.trim(),
      author: bookForm.author.trim(),
      price: price,
      stock: stock,
      category: bookForm.category.trim(),
      description: bookForm.description.trim(),
      image: bookForm.image.trim(),
    };
    
    try {
      await createSupplier(bookData, config);
      setShowBookModal(false);
      setBookForm({
        title: '',
        author: '',
        price: '',
        category: '',
        description: '',
        image: '',
        stock: 0,
      });
      fetchSuppliersAndKpis(config);
      // Fetch logs after book order
      if (selectedSupplier) {
        const logsRes = await getSupplierLogs(selectedSupplier._id, config);
        setLogs(logsRes.data);
      }
      alert('Book added successfully!');
    } catch (err) {
      alert('Failed to add book: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h1 className="text-3xl font-bold mb-6 text-red-700">Supplier Dashboard</h1>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">Total Suppliers</div>
          <div className="text-2xl text-red-700">{totalSuppliers}</div>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">Active vs Inactive</div>
          <div className="text-2xl text-red-700">{activeSuppliers} / {inactiveSuppliers}</div>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">Most Used Supplier</div>
          <div className="text-2xl text-red-700">{mostUsedSupplier}</div>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">New This Month</div>
          <div className="text-2xl text-red-700">{newSuppliersThisMonth}</div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow rounded p-4 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-red-700">Active vs Inactive Suppliers</h3>
          <Pie data={pieData} style={{ maxWidth: 300, maxHeight: 300 }} width={300} height={300} />
        </div>
        <div className="bg-white shadow rounded p-4 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-red-700">New Suppliers Per Month</h3>
          <Bar data={barData} options={{ plugins: { legend: { display: false } } }} style={{ maxWidth: 300, maxHeight: 300 }} width={300} height={300} />
        </div>
      </div>
      {/* Supplier Table */}
      <div className="bg-white rounded shadow p-6 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-700">Suppliers</h2>
          <button
            onClick={handleAdd}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2 shadow"
          >
            Add New
          </button>
        </div>
        <table style={tableStyles}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8' }}>
              <th style={cellStyles}>ID</th>
              <th style={cellStyles}>Company</th>
              <th style={cellStyles}>Email/Phone</th>
              <th style={cellStyles}>Address</th>
              <th style={cellStyles}>Status</th>
              <th style={cellStyles}>Type</th>
              <th style={cellStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allSuppliers.map((supplier, index) => (
              <tr
                key={supplier._id}
                style={{
                  backgroundColor: index % 2 === 0 ? '#f9fafb' : '#fff',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f9fafb' : '#fff')}
              >
                <td style={cellStyles}>{supplier._id}</td>
                <td style={cellStyles}>{supplier.companyName}</td>
                <td style={cellStyles}>{supplier.email} / {supplier.phone}</td>
                <td style={cellStyles}>{supplier.address}</td>
                <td style={cellStyles}>{supplier.status}</td>
                <td style={cellStyles}>{supplier._type}</td>
                <td style={cellStyles}>
                  {supplier._type === 'Supplier' ? (
                    <>
                      <button onClick={() => handleEdit(supplier)} style={{ color: 'blue', marginRight: '8px', fontSize: '1.1em' }}>Edit</button>
                      <button onClick={() => handleDelete(supplier._id)} style={{ color: 'red', marginRight: '8px', fontSize: '1.1em' }}>Delete</button>
                      <button onClick={() => handleViewBooks(supplier)} style={{ color: 'green', marginRight: '8px', fontSize: '1.1em' }}>View Books</button>
                      {(user?.role === 'inventory department' || user?.role === 'admin' || user?.role === 'supplier department') && (
                        <button
                          onClick={() => handleAddBook(supplier)}
                          style={{ color: 'purple', fontSize: '1.1em' }}
                        >
                          Add Book
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handleViewBooks(supplier)} style={{ color: 'green', fontSize: '1.1em' }}>View Books</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">
              {selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
                const supplierData = {
                  companyName: e.target.companyName.value,
                  email: e.target.email.value,
                  phone: e.target.phone.value,
                  address: e.target.address.value,
                  status: e.target.status.value,
                };
                if (!selectedSupplier) {
                  supplierData.createdAt = new Date().toISOString(); // Only set for new supplier
                }
                try {
                  if (selectedSupplier) {
                    await updateSupplier(selectedSupplier._id, supplierData, config);
                  } else {
                    await createSupplier(supplierData, config);
                  }
                  setShowModal(false);
                  fetchSuppliersAndKpis(config);
                } catch (err) {
                  alert('Failed to save supplier: ' + (err.response?.data?.message || err.message));
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                name="companyName"
                defaultValue={selectedSupplier?.companyName || ''}
                placeholder="Company Name"
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="email"
                name="email"
                defaultValue={selectedSupplier?.email || ''}
                placeholder="Email"
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="phone"
                defaultValue={selectedSupplier?.phone || ''}
                placeholder="Phone"
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="address"
                defaultValue={selectedSupplier?.address || ''}
                placeholder="Address"
                required
                className="w-full border px-3 py-2 rounded"
              />
              <select
                name="status"
                defaultValue={selectedSupplier?.status || 'active'}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded flex-1">
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Books Modal */}
      {booksModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => setBooksModal({ open: false, books: [], supplier: null })}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">
              Books for {booksModal.supplier?.companyName}
            </h3>
            {booksModal.books.length === 0 ? (
              <div className="text-gray-500">No books found for this supplier.</div>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-red-100">
                    <th>Title</th>
                    <th>Author</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {booksModal.books.map(book => (
                    <tr key={book._id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>₱{Number(book.price).toFixed(2)}</td>
                      <td>{book.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {/* Add Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => setShowBookModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">
              Add Book for {selectedSupplier?.companyName}
            </h3>
            <form onSubmit={handleBookSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={bookForm.title}
                onChange={handleBookFormChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="author"
                placeholder="Author"
                value={bookForm.author}
                onChange={handleBookFormChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={bookForm.price}
                onChange={handleBookFormChange}
                onKeyDown={(e) => {
                  // Prevent entering minus sign, 'e', 'E', '+', and other invalid characters
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // Prevent pasting negative values
                  const paste = e.clipboardData.getData('text');
                  if (paste.includes('-') || isNaN(paste) || parseFloat(paste) < 0) {
                    e.preventDefault();
                  }
                }}
                required
                min="0"
                step="0.01"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={bookForm.stock}
                onChange={handleBookFormChange}
                onKeyDown={(e) => {
                  // Prevent entering minus sign, decimal point, 'e', 'E', '+', and other invalid characters
                  if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // Prevent pasting negative values or decimals
                  const paste = e.clipboardData.getData('text');
                  if (paste.includes('-') || paste.includes('.') || isNaN(paste) || parseInt(paste) < 0) {
                    e.preventDefault();
                  }
                }}
                required
                min="0"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={bookForm.category}
                onChange={handleBookFormChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="image"
                placeholder="Image URL"
                value={bookForm.image}
                onChange={handleBookFormChange}
                className="w-full border px-3 py-2 rounded"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={bookForm.description}
                onChange={handleBookFormChange}
                className="w-full border px-3 py-2 rounded"
              />
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded flex-1">
                  Save Book
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border flex-1"
                  onClick={() => setShowBookModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;
