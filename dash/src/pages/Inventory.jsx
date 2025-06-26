import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const emptyForm = {
  title: '',
  author: '',
  price: '',
  description: '',
  category: '',
  supplier: '',
  stock: '',
  image: ''
};

const Inventory = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categories, setCategories] = useState(['Fiction', 'Non-Fiction', 'Science', 'History']);
  const [suppliers, setSuppliers] = useState([]);

  const API = axios.create({
    baseURL: 'http://192.168.9.16:5000/api',
    headers: { Authorization: `Bearer ${user?.token}` }
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/books');
      setBooks(res.data);
    } catch (err) {
      alert('Failed to fetch books');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await API.get('/suppliers');
      // Fetch users with role 'supplier'
      const userRes = await API.get('/users', { headers: { Authorization: `Bearer ${user?.token}` } });
      const supplierUsers = (userRes.data || []).filter(u => u.role === 'supplier department');
      // Merge suppliers from /suppliers and supplier users
      const merged = [
        ...res.data,
        ...supplierUsers.map(u => ({
          _id: u._id,
          companyName: u.name || u.email || u._id,
          fromUser: true
        }))
      ];
      setSuppliers(merged);
    } catch (err) {
      alert('Failed to fetch suppliers');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return `http://192.168.9.16:5000${res.data.url}`; // Append base URL
    } catch (err) {
      alert('Failed to upload image');
      throw err;
    }
  };

  // Ensure supplier field is properly handled
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile); // Use the returned URL
      }

      const payload = {
        ...form,
        image: imageUrl,
        category: form.category,
        supplier: form.supplier || null, // Set supplier to null if not selected
      };

      console.log('Payload being sent:', payload); // Debugging log

      if (editing) {
        await API.put(`/books/${editing}`, payload);
      } else {
        await API.post('/books', payload);
      }
      setForm(emptyForm);
      setEditing(null);
      setImageFile(null);
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      console.error('Error during submission:', err.response?.data || err.message); // Debugging log
      alert(err.response?.data?.message || err.message || 'Error');
    }
  };

  const handleEdit = (b) => {
    setEditing(b._id);
    setForm({
      title: b.title,
      author: b.author,
      price: b.price,
      description: b.description || '',
      stock: b.stock,
      image: b.image || ''
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await API.delete(`/books/${id}`);
      fetchBooks();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    uploadImage(file);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Add styles for table alignment
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

  // Add styles for image alignment
  const imageStyles = {
    display: 'block',
    margin: '0 auto',
    maxWidth: '100px',
  };

  // --- Real Graph Data ---
  // 1. Stock by Category
  const stockByCategory = books.reduce((acc, book) => {
    if (!book.category) return acc;
    acc[book.category] = (acc[book.category] || 0) + (Number(book.stock) || 0);
    return acc;
  }, {});
  const stockByCategoryData = {
    labels: Object.keys(stockByCategory),
    datasets: [
      {
        data: Object.values(stockByCategory),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#A78BFA', '#F472B6', '#FBBF24', '#34D399'],
      },
    ],
  };

  // 2. Inventory Trends (stock added per month, based on createdAt)
  const inventoryTrends = {};
  books.forEach(book => {
    if (!book.createdAt) return;
    const date = new Date(book.createdAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    inventoryTrends[month] = (inventoryTrends[month] || 0) + (Number(book.stock) || 0);
  });
  const sortedMonths = Object.keys(inventoryTrends).sort();
  const inventoryTrendsData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Stock Added',
        data: sortedMonths.map(m => inventoryTrends[m]),
        fill: false,
        borderColor: '#36A2EB',
        backgroundColor: '#36A2EB',
        tension: 0.3,
      },
    ],
  };

  // 3. Top Products (by stock)
  const topProducts = [...books]
    .sort((a, b) => (b.stock || 0) - (a.stock || 0))
    .slice(0, 10);
  const topProductsData = {
    labels: topProducts.map(b => b.title),
    datasets: [
      {
        label: 'Stock',
        data: topProducts.map(b => b.stock),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#F87171', '#60A5FA'],
      },
    ],
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Inventory Management</h2>
      <button
        className="mb-6 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded shadow"
        onClick={handleAdd}
      >
        + Add Book
      </button>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); setImageFile(null); }}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">
              {editing ? 'Edit Book' : 'Add Book'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Author"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
                min="0"
                step="0.01"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                required
                min="0"
                className="w-full border px-3 py-2 rounded"
              />
              <div>
                <label className="block mb-1 text-sm text-red-700 font-semibold">Book Image</label>
                <input
                  type="text"
                  placeholder="Image URL"
                  value={form.image}
                  onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setImageFile(null); }}
                  className="w-full border px-3 py-2 rounded mb-2"
                />
                <div className="flex items-center gap-2">
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    <button
                      type="button"
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      onClick={e => {
                        e.preventDefault();
                        e.target.previousSibling.click();
                      }}
                    >
                      Choose File
                    </button>
                  </label>
                  {imageFile && (
                    <span className="text-xs text-green-700">{imageFile.name}</span>
                  )}
                </div>
                {(form.image || imageFile) && (
                  <div className="mt-2">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : form.image}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded shadow"
                    />
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              />
              <select
                value={form.category || ''}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={form.supplier || ''}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="" disabled>Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.companyName}
                    {supplier.fromUser ? ' (User)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded flex-1">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border flex-1"
                  onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); setImageFile(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
        <table className="min-w-full rounded-2xl overflow-hidden" style={tableStyles}>
          <thead>
            <tr className="bg-white/70 text-red-700 font-semibold text-lg">
              <th className="px-6 py-3 border-b" style={cellStyles}>Title</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Author</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Price</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Stock</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Image</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Description</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Category</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Supplier</th>
              <th className="px-6 py-3 border-b" style={cellStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">No books found</td>
              </tr>
            ) : books.map(b => (
              <tr key={b._id} className="hover:bg-red-50 transition">
                <td className="border-b px-6 py-3" style={cellStyles}>{b.title}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>{b.author}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>${Number(b.price).toFixed(2)}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>{b.stock}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>
                  {b.image && (
                    <img
                      src={b.image}
                      alt={b.title}
                      className="h-12 w-12 object-cover rounded shadow"
                      style={imageStyles}
                      onClick={() => handleImageClick(b.image)}
                    />
                  )}
                </td>
                <td className="border-b px-6 py-3 max-w-xs truncate" style={cellStyles}>{b.description}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>{b.category}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>{suppliers.find(s => s._id === b.supplier)?.companyName || 'Unknown'}</td>
                <td className="border-b px-6 py-3" style={cellStyles}>
                  <button
                    className="text-blue-600 hover:bg-blue-50 transition rounded px-3 py-1 mr-2"
                    onClick={() => handleEdit(b)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:bg-red-50 transition rounded px-3 py-1"
                    onClick={() => handleDelete(b._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br></br>
       <br></br>
        <br></br>
    

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        <div style={{ width: '30%' }}>
          <h2 className="text-xl font-bold mb-4 text-red-700">Stock by Category</h2>
          <Pie data={stockByCategoryData} />
        </div>

        <div style={{ width: '30%' }}>
          <h2 className="text-xl font-bold mb-4 text-red-700">Inventory Trends</h2>
          <Line data={inventoryTrendsData} />
        </div>

        <div style={{ width: '30%' }}>
          <h2 className="text-xl font-bold mb-4 text-red-700">Top Products</h2>
          <Bar data={topProductsData} />
        </div>
      </div>

      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <img
            src={selectedImage}
            alt="Book Preview"
            style={{ maxWidth: '90%', maxHeight: '80%' }}
          />
          <button
            onClick={closeImageModal}
            style={{
              marginTop: '20px',
              backgroundColor: 'white',
              border: 'none',
              padding: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaArrowLeft style={{ marginRight: '5px' }} /> Back
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;
