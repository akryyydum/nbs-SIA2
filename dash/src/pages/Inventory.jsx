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

  // --- Order from Supplier Modal State ---
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderSupplier, setOrderSupplier] = useState('');
  const [orderItems, setOrderItems] = useState([
    { bookId: '', quantity: 1, isNew: false, newBook: { title: '', author: '', price: '', category: '', description: '', image: '' } }
  ]);

  const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`,
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
      // Try to fetch /suppliers, fallback to empty array if fails
      let supplierList = [];
      try {
        const res = await API.get('/suppliers');
        supplierList = res.data || [];
      } catch {
        supplierList = [];
      }

      // Try to fetch users with role 'supplier department', fallback to empty array if fails/forbidden
      let supplierUsers = [];
      try {
        const userRes = await API.get('/users', { headers: { Authorization: `Bearer ${user?.token}` } });
        supplierUsers = (userRes.data || []).filter(u => u.role === 'supplier department');
      } catch {
        supplierUsers = [];
      }

      // Merge both sources
      const merged = [
        ...supplierList,
        ...supplierUsers.map(u => ({
          _id: u._id,
          companyName: u.name || u.email || u._id,
          fromUser: true
        }))
      ];
      setSuppliers(merged);
    } catch (err) {
      // Only alert if both fail
      alert('Failed to fetch suppliers');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Correct the base URL for uploaded images
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Use the same base URL as API for image URLs
      return `${API.defaults.baseURL.replace(/\/api$/, '')}${res.data.url}`;
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

  // --- Order from Supplier Handler ---
  const handleOrderFromSupplier = async (e) => {
    e.preventDefault();
    try {
      for (const item of orderItems) {
        if (item.isNew) {
          // Create new book with stock = quantity
          const payload = {
            ...item.newBook,
            stock: item.quantity,
            supplier: orderSupplier,
          };
          await API.post('/books', payload);
        } else {
          // Increase stock of existing book
          await API.put(`/books/${item.bookId}/increase-stock`, {
            quantity: item.quantity,
            supplier: orderSupplier,
          });
        }
      }
      setOrderModalOpen(false);
      setOrderSupplier('');
      setOrderItems([{ bookId: '', quantity: 1, isNew: false, newBook: { title: '', author: '', price: '', category: '', description: '', image: '' } }]);
      fetchBooks();
      alert('Order placed and inventory updated!');
    } catch (err) {
      alert('Failed to order: ' + (err.response?.data?.message || err.message));
    }
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
      <div className="flex gap-4 mb-6">
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded shadow"
          onClick={handleAdd}
        >
          + Add Book
        </button>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
          onClick={() => setOrderModalOpen(true)}
        >
          Order from Supplier
        </button>
      </div>
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
      {/* Order from Supplier Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => setOrderModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-green-700">Order from Supplier</h3>
            <form onSubmit={handleOrderFromSupplier} className="space-y-4">
              <div>
                <label className="font-semibold">Supplier:</label>
                <select
                  className="border px-3 py-2 rounded w-full"
                  value={orderSupplier}
                  onChange={e => setOrderSupplier(e.target.value)}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.companyName}{s.fromUser ? ' (User)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold">Books to Order:</label>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="border p-3 rounded mb-2 bg-gray-50">
                    <div className="flex gap-2 items-center mb-2">
                      <label className="text-sm">
                        <input
                          type="checkbox"
                          checked={item.isNew}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].isNew = e.target.checked;
                            setOrderItems(arr);
                          }}
                        /> New Book
                      </label>
                      <button
                        type="button"
                        className="text-red-600 font-bold ml-auto"
                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                        disabled={orderItems.length === 1}
                      >×</button>
                    </div>
                    {!item.isNew ? (
                      <>
                        <select
                          className="border px-2 py-1 rounded w-full mb-2"
                          value={item.bookId}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].bookId = e.target.value;
                            setOrderItems(arr);
                          }}
                          required
                        >
                          <option value="">Select Book</option>
                          {books.map(b => (
                            <option key={b._id} value={b._id}>{b.title} by {b.author}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Title"
                          className="border px-2 py-1 rounded"
                          value={item.newBook.title}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].newBook.title = e.target.value;
                            setOrderItems(arr);
                          }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Author"
                          className="border px-2 py-1 rounded"
                          value={item.newBook.author}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].newBook.author = e.target.value;
                            setOrderItems(arr);
                          }}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          className="border px-2 py-1 rounded"
                          value={item.newBook.price}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].newBook.price = e.target.value;
                            setOrderItems(arr);
                          }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Category"
                          className="border px-2 py-1 rounded"
                          value={item.newBook.category}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].newBook.category = e.target.value;
                            setOrderItems(arr);
                          }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          className="border px-2 py-1 rounded col-span-2"
                          value={item.newBook.description}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].newBook.description = e.target.value;
                            setOrderItems(arr);
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          className="border px-2 py-1 rounded col-span-2"
                          value={item.newBook.image}
                          onChange={e => {
                            const arr = [...orderItems];
                            arr[idx].newBook.image = e.target.value;
                            setOrderItems(arr);
                          }}
                        />
                      </div>
                    )}
                    <div className="flex gap-2 items-center mt-2">
                      <label className="text-sm">Quantity:</label>
                      <input
                        type="number"
                        min={1}
                        className="border px-2 py-1 rounded w-24"
                        value={item.quantity}
                        onChange={e => {
                          const arr = [...orderItems];
                          arr[idx].quantity = Number(e.target.value);
                          setOrderItems(arr);
                        }}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-green-600 font-bold"
                  onClick={() => setOrderItems([...orderItems, { bookId: '', quantity: 1, isNew: false, newBook: { title: '', author: '', price: '', category: '', description: '', image: '' } }])}
                >+ Add Another Book</button>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors"
              >
                Place Order
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ...existing code for table, charts, and image modal... */}
    </div>
  );
};

export default Inventory;
