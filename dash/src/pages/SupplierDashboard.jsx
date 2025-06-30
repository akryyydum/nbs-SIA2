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

  // Fetch data (with auth)
  useEffect(() => {
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    getSuppliers(config).then(res => setSuppliers(res.data));
    getSupplierKPIs(config).then(res => setKpis(res.data));
    // Fetch users with role 'supplier department'
    axios.get('/api/users', config)
      .then(res => {
        const users = (res.data || []).filter(u => u.role === 'supplier department');
        setSupplierUsers(users);
      })
      .catch(() => setSupplierUsers([]));
  }, [user]);

  // Handlers for CRUD (to be implemented)
  const handleAdd = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };
  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    getSupplierProducts(supplier._id, config).then(res => setProducts(res.data));
    getSupplierLogs(supplier._id, config).then(res => setLogs(res.data));
  };
  const handleDelete = async (id) => {
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      await deleteSupplier(id, config);
      setSuppliers(suppliers.filter(s => s._id !== id));
    }
  };

  // Show books for a supplier
  const handleViewBooks = async (supplier) => {
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    const res = await getBooksBySupplier(supplier._id, config);
    setBooksModal({ open: true, books: res.data, supplier });
  };

  // Add Book Handler
  const handleAddBook = (supplier) => {
    setSelectedSupplier(supplier);
    setBookForm({
      title: '',
      author: '',
      price: '',
      category: '',
      description: '',
      image: '',
      stock: 0,
    });
    setShowBookModal(true);
  };

  const handleBookFormChange = (e) => {
    const { name, value } = e.target;
    setBookForm(f => ({ ...f, [name]: value }));
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
    try {
      await axios.post(`/api/suppliers/${selectedSupplier._id}/books`, bookForm, config);
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
      // Optionally refresh books modal if open
      if (booksModal.open && booksModal.supplier?._id === selectedSupplier._id) {
        const res = await getBooksBySupplier(selectedSupplier._id, config);
        setBooksModal(bm => ({ ...bm, books: res.data }));
      }
    } catch (err) {
      alert('Failed to add book: ' + (err.response?.data?.message || err.message));
    }
  };

  // Merge suppliers and supplierUsers for table
  const allSuppliers = [
    ...suppliers.map(s => ({ ...s, _type: 'Supplier' })),
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
      userObj: u
    }))
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-red-700">Supplier Dashboard</h1>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">Total Suppliers</div>
          <div className="text-2xl text-red-700">{kpis.totalSuppliers || '--'}</div>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">Active vs Inactive</div>
          <div className="text-2xl text-red-700">{kpis.activeSuppliers || '--'} / {kpis.inactiveSuppliers || '--'}</div>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">Most Used Supplier</div>
          <div className="text-2xl text-red-700">{kpis.mostUsedSupplier || '--'}</div>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-lg font-semibold">New This Month</div>
          <div className="text-2xl text-red-700">{kpis.newSuppliersThisMonth || '--'}</div>
        </div>
      </div>
      {/* Supplier Table */}
      <div className="bg-white shadow rounded p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Suppliers</h2>
          <button onClick={handleAdd} className="bg-red-600 text-white px-4 py-2 rounded">Add New</button>
        </div>
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-red-100 text-left">
              <th className="px-4 py-2 border border-gray-300">ID</th>
              <th className="px-4 py-2 border border-gray-300">Company</th>
              <th className="px-4 py-2 border border-gray-300">Contact</th>
              <th className="px-4 py-2 border border-gray-300">Email/Phone</th>
              <th className="px-4 py-2 border border-gray-300">Address</th>
              <th className="px-4 py-2 border border-gray-300">Categories</th>
              <th className="px-4 py-2 border border-gray-300">Status</th>
              <th className="px-4 py-2 border border-gray-300">Type</th>
              <th className="px-4 py-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allSuppliers.map((supplier, index) => (
              <tr
                key={supplier._id}
                className={`$ {index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
              >
                <td className="px-4 py-2 border border-gray-300">{supplier._id}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier.companyName}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier.contactPerson}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier.email} / {supplier.phone}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier.address}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier.productCategories?.join(', ')}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier.status}</td>
                <td className="px-4 py-2 border border-gray-300">{supplier._type}</td>
                <td className="px-4 py-2 border border-gray-300">
                  {supplier._type === 'Supplier' ? (
                    <>
                      <button onClick={() => handleEdit(supplier)} className="text-blue-600 mr-2">Edit</button>
                      <button onClick={() => handleDelete(supplier._id)} className="text-red-600 mr-2">Delete</button>
                      <button onClick={() => handleViewBooks(supplier)} className="text-green-600 mr-2">View Books</button>
                      {(user?.role === 'inventory department' || user?.role === 'admin' || user?.role === 'supplier department') && (
                        <button
                          onClick={() => handleAddBook(supplier)}
                          className="text-purple-600"
                        >
                          Add Book
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handleViewBooks(supplier)} className="text-green-600">View Books</button>
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
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
              onSubmit={(e) => {
                e.preventDefault();
                const supplierData = {
                  companyName: e.target.companyName.value,
                  contactPerson: e.target.contactPerson.value,
                  email: e.target.email.value,
                  phone: e.target.phone.value,
                  address: e.target.address.value,
                  productCategories: e.target.productCategories.value.split(',').map(cat => cat.trim()),
                  status: e.target.status.value,
                };
                if (selectedSupplier) {
                  updateSupplier(selectedSupplier._id, supplierData).then(() => {
                    setShowModal(false);
                    getSuppliers().then(res => setSuppliers(res.data));
                  });
                } else {
                  createSupplier(supplierData).then(() => {
                    setShowModal(false);
                    getSuppliers().then(res => setSuppliers(res.data));
                  });
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
                type="text"
                name="contactPerson"
                defaultValue={selectedSupplier?.contactPerson || ''}
                placeholder="Contact Person"
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
              <input
                type="text"
                name="productCategories"
                defaultValue={selectedSupplier?.productCategories?.join(', ') || ''}
                placeholder="Product Categories (comma-separated)"
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
