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
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-red-100">
              <th>ID</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Email/Phone</th>
              <th>Address</th>
              <th>Categories</th>
              <th>Status</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allSuppliers.map(supplier => (
              <tr key={supplier._id}>
                <td>{supplier._id}</td>
                <td>{supplier.companyName}</td>
                <td>{supplier.contactPerson}</td>
                <td>{supplier.email} / {supplier.phone}</td>
                <td>{supplier.address}</td>
                <td>{supplier.productCategories?.join(', ')}</td>
                <td>{supplier.status}</td>
                <td>
                  {supplier._type}
                </td>
                <td>
                  {/* Only allow edit/delete for Supplier documents, not for users */}
                  {supplier._type === 'Supplier' ? (
                    <>
                      <button onClick={() => handleEdit(supplier)} className="text-blue-600 mr-2">Edit</button>
                      <button onClick={() => handleDelete(supplier._id)} className="text-red-600 mr-2">Delete</button>
                      <button onClick={() => handleViewBooks(supplier)} className="text-green-600">View Books</button>
                    </>
                  ) : (
                    <>
                      {/* For users, only allow View Books */}
                      <button onClick={() => handleViewBooks(supplier)} className="text-green-600">View Books</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Linked Products (Read-only) */}
      <div className="bg-white shadow rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-2">Linked Products</h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-red-100">
              <th>SKU</th><th>Name</th><th>Last Order Date</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.sku}>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{product.lastOrderDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Performance & History Logs */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-2">Performance & History Logs</h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-red-100">
              <th>Timestamp</th><th>Action</th><th>By</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id}>
                <td>{log.timestamp}</td>
                <td>{log.action}</td>
                <td>{log.by}</td>
                <td>{log.notes}</td>
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
    </div>
  );
};

export default SupplierDashboard;
