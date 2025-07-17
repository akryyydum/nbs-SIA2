import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';
// Add Chart.js imports
import { Bar, Line } from 'react-chartjs-2';
import { Chart, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

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

const imageStyles = {
  display: 'block',
  margin: '0 auto',
  maxWidth: '100px',
};

const emptyForm = {
  title: '',
  author: '',
  price: '',
  description: '',
  category: '',
  stock: '',
  image: '',
};

const SupplierBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [categories] = useState(['Fiction', 'Non-Fiction', 'Science', 'History']);

  useEffect(() => {
    if (user?.token && user?._id) fetchBooks();
    // eslint-disable-next-line
  }, [user]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/suppliers/${user._id}/supplierBook`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setBooks(res.data);
    } catch (err) {
      setBooks([]);
    }
    setLoading(false);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // After upload, before saving to DB
      const base = axios.defaults.baseURL.replace('/api', '');
      const url = res.data.url.startsWith('/')
        ? `${base}${res.data.url}`
        : res.data.url;
      return url;
    } catch (err) {
      alert('Failed to upload image');
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!form.author.trim()) {
      alert('Author is required');
      return;
    }
    
    // Validate price and stock
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    
    // Price validation
    if (!form.price || form.price === '') {
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
    if (form.stock === '' || form.stock === null || form.stock === undefined) {
      alert('Stock is required');
      return;
    }
    if (isNaN(stock)) {
      alert('Please enter a valid stock number');
      return;
    }
    if (stock < 1) {
      alert('Stock must be at least 1');
      return;
    }
    // Check if stock is not an integer
    if (!Number.isInteger(stock)) {
      alert('Stock must be a whole number');
      return;
    }
    
    try {
      let imageUrl = form.image;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        ...form,
        price: price,
        stock: stock,
        image: imageUrl,
      };

      if (editing) {
        await axios.put(
          `/api/suppliers/${user._id}/books/${editing}`,
          payload,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      } else {
        await axios.post(
          `/api/suppliers/${user._id}/books`,
          payload,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      }

      setForm(emptyForm);
      setEditing(null);
      setImageFile(null);
      setModalOpen(false);
      fetchBooks();
      alert('Book saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error');
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    try {
      const imageUrl = await uploadImage(file);
      setForm((f) => ({ ...f, image: imageUrl }));
    } catch (err) {
      alert('Image upload failed');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleEdit = (book) => {
    setEditing(book._id);
    setForm({
      title: book.title,
      author: book.author,
      price: book.price,
      description: book.description || '',
      category: book.category || '',
      stock: book.stock,
      image: book.image || '',
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await axios.delete(
        `/api/suppliers/${user._id}/books/${bookId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      fetchBooks();
    } catch (err) {
      alert('Failed to delete book');
    }
  };

  // Chart Data
  // Bar: Stock per Book
  const barData = {
    labels: books.map(b => b.title),
    datasets: [
      {
        label: 'Stock',
        data: books.map(b => b.stock),
        backgroundColor: '#dc2626',
      },
    ],
  };

  // Line: Price per Book
  const lineData = {
    labels: books.map(b => b.title),
    datasets: [
      {
        label: 'Price',
        data: books.map(b => Number(b.price)),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563eb',
      },
    ],
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-red-700">My Supplier Books</h2>
      <div className="flex gap-4 mb-6">
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded flex items-center gap-2 shadow"
          onClick={handleAdd}
        >
          <FaPlus />
          Add Book
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-bold mb-2 text-red-700">Stock per Book</h3>
          <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-lg font-bold mb-2 text-blue-700">Price per Book</h3>
          <Line data={lineData} options={{ plugins: { legend: { display: false } } }} />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setForm(emptyForm);
                setImageFile(null);
              }}
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
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseFloat(value) >= 1)) {
                    setForm(f => ({ ...f, price: value }));
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent entering minus sign, 'e', 'E', '+', and other invalid characters
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // Prevent pasting negative values or less than 1
                  const paste = e.clipboardData.getData('text');
                  if (paste.includes('-') || isNaN(paste) || parseFloat(paste) < 1) {
                    e.preventDefault();
                  }
                }}
                required
                min="1"
                step="0.01"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseInt(value) >= 1 && Number.isInteger(parseFloat(value)))) {
                    setForm(f => ({ ...f, stock: value }));
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent entering minus sign, decimal point, 'e', 'E', '+', and other invalid characters
                  if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // Prevent pasting negative values, decimals, or less than 1
                  const paste = e.clipboardData.getData('text');
                  if (paste.includes('-') || paste.includes('.') || isNaN(paste) || parseInt(paste) < 1) {
                    e.preventDefault();
                  }
                }}
                required
                min="1"
                className="w-full border px-3 py-2 rounded"
              />

              <div className="flex items-center gap-2 mb-2">
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
                    onClick={(e) => e.target.previousSibling.click()}
                  >
                    Choose File
                  </button>
                </label>
                {imageFile && <span className="text-xs text-green-700">{imageFile.name}</span>}
              </div>

              {form.image && (
                <div className="mt-2">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded shadow"
                  />
                </div>
              )}

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
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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

      <div className="mt-8 bg-white rounded shadow p-4">
        <h3 className="text-lg font-bold mb-2 text-red-700">Supplier Books Table</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table style={tableStyles} className="min-w-full">
            <thead>
              <tr className="bg-red-100 text-gray-700 uppercase text-xs tracking-wider">
                <th style={cellStyles} className="py-3 px-4">Title</th>
                <th style={cellStyles} className="py-3 px-4">Author</th>
                <th style={cellStyles} className="py-3 px-4">Price</th>
                <th style={cellStyles} className="py-3 px-4">Stock</th>
                <th style={cellStyles} className="py-3 px-4">Image</th>
                <th style={cellStyles} className="py-3 px-4">Description</th>
                <th style={cellStyles} className="py-3 px-4">Category</th>
                <th style={cellStyles} className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b, idx) => (
                <tr
                  key={b._id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff',
                    transition: 'background 0.2s',
                  }}
                  className="hover:bg-red-50 transition-colors"
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#f9fafb' : '#fff')}
                >
                  <td style={cellStyles} className="py-2 px-4 font-medium">{b.title}</td>
                  <td style={cellStyles} className="py-2 px-4">{b.author}</td>
                  <td style={cellStyles} className="py-2 px-4 text-red-700 font-semibold">₱{Number(b.price).toFixed(2)}</td>
                  <td style={cellStyles} className="py-2 px-4">{b.stock}</td>
                  <td style={cellStyles} className="py-2 px-4">
                    {b.image ? (
                      <img
                        src={b.image.startsWith('/') 
                          ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api','') || 'http://localhost:5000'}${b.image}` 
                          : b.image}
                        alt={b.title}
                        style={imageStyles}
                        className="rounded shadow border border-gray-200"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td style={cellStyles} className="py-2 px-4 max-w-xs truncate">{b.description}</td>
                  <td style={cellStyles} className="py-2 px-4">
                    <span className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                      {b.category}
                    </span>
                  </td>
                  <td style={cellStyles} className="py-2 px-4">
                    <button
                      onClick={() => handleEdit(b)}
                      className="text-blue-600 hover:underline mr-2 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierBooks;
