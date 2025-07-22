import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaBook, FaUser, FaTags, FaWarehouse, FaPlus, FaTruck, FaChartPie, FaChartBar, FaListUl } from 'react-icons/fa';
import { Link } from 'react-router-dom';

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
  const [categories] = useState(['Fiction', 'Non-Fiction', 'Science', 'History']);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierUsers, setSupplierUsers] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState([{ book: '', quantity: 1 }]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [supplierBooks, setSupplierBooks] = useState([]);

  const API = axios.create({
    baseURL: 'https://nbs-sia2.onrender.com/api',
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
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await API.get('/suppliers');
      setSuppliers(res.data || []);
      // Fetch supplier users (users with supplier department role)
      const userRes = await API.get('/suppliers/users-suppliers');
      setSupplierUsers(userRes.data || []);
    } catch (err) {
      alert('Failed to fetch suppliers');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Merge suppliers and supplierUsers for dropdowns and display
  const allSuppliers = [
    ...suppliers,
    ...supplierUsers
  ];

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // After upload, before saving to DB
      const base = API.defaults.baseURL.replace('/api', '');
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

    // Data validation
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!form.author.trim()) {
      alert('Author is required');
      return;
    }
    if (!form.category) {
      alert('Category is required');
      return;
    }
    if (!form.supplier) {
      alert('Supplier is required');
      return;
    }

    // Validate price and stock
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock);

    if (isNaN(price) || price < 1) {
      alert('Please enter a valid price of 1 or greater');
      return;
    }

    if (isNaN(stock) || stock < 1) {
      alert('Please enter a valid stock number of 1 or greater');
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
        supplier: form.supplier || null
      };

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
      category: b.category || '',
      supplier: b.supplier || '',
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

  const handleOrderFromSupplier = async (orderDetails) => {
    try {
      // Handle new books - create them first
      const processedItems = [];
      
      for (const item of orderDetails.items) {
        if (item.isNewBook) {
          // Create the new book first
          const newBookData = {
            title: item.title,
            author: item.author,
            price: item.price,
            description: item.description || '',
            category: item.category,
            supplier: orderDetails.supplier,
            stock: 0, // Start with 0 stock, will be updated after order
            image: item.image || ''
          };
          
          const bookResponse = await API.post('/books', newBookData);
          processedItems.push({
            book: bookResponse.data._id,
            quantity: item.quantity
          });
        } else {
          processedItems.push({
            book: item.book,
            quantity: item.quantity
          });
        }
      }

      const finalPayload = {
        ...orderDetails,
        items: processedItems
      };

      await API.post('/orders', finalPayload);
      alert('Order placed successfully!');
      fetchBooks();
    } catch (err) {
      console.error('Order error:', err);
      alert('Failed to place order: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddOrderBook = () => {
    setOrderDetails([...orderDetails, { book: '', quantity: 1 }]);
  };

  const handleOrderSubmit = async () => {
    // Validate that all fields are completed
    const hasInvalidOrder = orderDetails.some(o => {
      if (o.newBook) {
        const price = parseFloat(o.price);
        const quantity = parseInt(o.quantity);
        
        // Check for values less than 1 and invalid numbers
        if (isNaN(price) || price < 1) return true;
        if (isNaN(quantity) || quantity < 1) return true;
        
        return !o.title || !o.author || !o.category;
      } else {
        const quantity = parseInt(o.quantity);
        return !o.book || isNaN(quantity) || quantity < 1;
      }
    });

    if (!selectedSupplier || hasInvalidOrder) {
      alert('Please complete all fields with valid values of 1 or greater');
      return;
    }

    // Transform the data to match backend expectations
    const payload = {
      items: orderDetails.map(order => {
        if (order.newBook) {
          return {
            isNewBook: true,
            title: order.title,
            author: order.author,
            price: parseFloat(order.price),
            description: order.description || '',
            category: order.category,
            image: order.image || '',
            quantity: parseInt(order.quantity)
          };
        } else {
          return {
            book: order.book,
            quantity: parseInt(order.quantity)
          };
        }
      }),
      modeofPayment: 'Supplier Order', // Add a mode of payment for supplier orders
      supplier: selectedSupplier,
      isSupplierOrder: true
    };

    await handleOrderFromSupplier(payload);
    setOrderModalOpen(false);
    setOrderDetails([{ book: '', quantity: 1 }]);
    setSelectedSupplier('');
  };

  useEffect(() => {
    const fetchSupplierBooks = async () => {
      if (!selectedSupplier) {
        setSupplierBooks([]);
        return;
      }
      try {
        const res = await API.get(`/suppliers/${selectedSupplier}/supplierBook`);
        setSupplierBooks(res.data || []);
      } catch (err) {
        setSupplierBooks([]);
        alert('Failed to fetch supplier books');
      }
    };

    if (orderModalOpen && selectedSupplier) {
      fetchSupplierBooks();
    }
  }, [selectedSupplier, orderModalOpen]);

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

  // Group duplicate books by title and author, sum stocks, join supplier IDs
  const groupedBooksMap = {};
  books.forEach(book => {
    const key = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`;
    if (!groupedBooksMap[key]) {
      groupedBooksMap[key] = { ...book, stock: Number(book.stock) || 0, suppliers: new Set([book.supplier]) };
    } else {
      groupedBooksMap[key].stock += Number(book.stock) || 0;
      groupedBooksMap[key].suppliers.add(book.supplier);
    }
  });
  const groupedBooks = Object.values(groupedBooksMap).map(b => ({
    ...b,
    suppliers: Array.from(b.suppliers)
  }));

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Inventory Management</h2>
      <div className="flex gap-4 mb-6">
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded flex items-center gap-2 shadow"
          onClick={handleAdd}
        >
          <FaPlus />
          Add Book
        </button>
        <button
          type="button"
          className="px-6 py-2 bg-green-600 text-white rounded flex items-center gap-2 shadow hover:bg-green-700 transition"
          onClick={() => setOrderModalOpen(true)}
        >
          <FaTruck />
          Order from Supplier
        </button>
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
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full border px-3 py-2 rounded" />
              <input type="text" placeholder="Author" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required className="w-full border px-3 py-2 rounded" />
              <input 
                type="number" 
                placeholder="Price" 
                value={form.price} 
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || (parseFloat(value) >= 1)) {
                    setForm(f => ({ ...f, price: value }));
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
                  if (value === '' || (parseInt(value) >= 1)) {
                    setForm(f => ({ ...f, stock: value }));
                  }
                }} 
                required 
                min="1"
                className="w-full border px-3 py-2 rounded" 
              />
              
              {/* Hidden Image URL field to avoid user interference */}
              <input type="hidden" value={form.image} readOnly />

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
              
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              <select value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border px-3 py-2 rounded">
                <option value="" disabled>Select Category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.supplier || ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full border px-3 py-2 rounded">
                <option value="" disabled>Select Supplier</option>
                {allSuppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.companyName || s.name || s.email}
                    {s.role === 'supplier department' ? ' (User)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 rounded border flex-1" onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); setImageFile(null); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => setOrderModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-green-700">Order from Supplier</h3>
            <form className="space-y-4">
              <select
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="" disabled>Select Supplier</option>
                {allSuppliers.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.companyName || s.name || s.email}
                    {s.role === 'supplier department' ? ' (User)' : ''}
                  </option>
                ))}
              </select>
              {orderDetails.map((order, index) => (
                <div key={index} className="border p-4 rounded mb-2 relative">
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-600 text-lg"
                    onClick={() => {
                      const updatedOrders = orderDetails.filter((_, i) => i !== index);
                      setOrderDetails(updatedOrders);
                    }}
                    aria-label="Remove"
                  >
                    &times;
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={order.newBook || false}
                      onChange={e => {
                        const updatedOrders = [...orderDetails];
                        updatedOrders[index].newBook = e.target.checked;
                        setOrderDetails(updatedOrders);
                      }}
                    />
                    <span>New Book</span>
                  </div>
                  {order.newBook ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={order.title || ''}
                        onChange={e => {
                          const updatedOrders = [...orderDetails];
                          updatedOrders[index].title = e.target.value;
                          setOrderDetails(updatedOrders);
                        }}
                        className="w-full border px-3 py-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Author"
                        value={order.author || ''}
                        onChange={e => {
                          const updatedOrders = [...orderDetails];
                          updatedOrders[index].author = e.target.value;
                          setOrderDetails(updatedOrders);
                        }}
                        className="w-full border px-3 py-2 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={order.price || ''}
                        onChange={e => {
                          const value = e.target.value;
                          if (value === '' || (parseFloat(value) >= 1)) {
                            const updatedOrders = [...orderDetails];
                            updatedOrders[index].price = value;
                            setOrderDetails(updatedOrders);
                          }
                        }}
                        min="1"
                        step="0.01"
                        className="w-full border px-3 py-2 rounded"
                      />
                      <select
                        value={order.category || ''}
                        onChange={e => {
                          const updatedOrders = [...orderDetails];
                          updatedOrders[index].category = e.target.value;
                          setOrderDetails(updatedOrders);
                        }}
                        className="w-full border px-3 py-2 rounded"
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Description"
                        value={order.description || ''}
                        onChange={e => {
                          const updatedOrders = [...orderDetails];
                          updatedOrders[index].description = e.target.value;
                          setOrderDetails(updatedOrders);
                        }}
                        className="w-full border px-3 py-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={order.image || ''}
                        onChange={e => {
                          const updatedOrders = [...orderDetails];
                          updatedOrders[index].image = e.target.value;
                          setOrderDetails(updatedOrders);
                        }}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                  ) : (
                    <select
                      value={order.book}
                      onChange={e => {
                        const updatedOrders = [...orderDetails];
                        updatedOrders[index].book = e.target.value;
                        setOrderDetails(updatedOrders);
                      }}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="" disabled>Select Book</option>
                      {supplierBooks.map(b => (
                        <option key={b._id} value={b._id}>{b.title}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    value={order.quantity}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || (parseInt(value) >= 1)) {
                        const updatedOrders = [...orderDetails];
                        updatedOrders[index].quantity = value === '' ? '' : Number(value);
                        setOrderDetails(updatedOrders);
                      }
                    }}
                    className="w-full border px-3 py-2 rounded mt-2"
                    min="1"
                    placeholder="Quantity"
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-green-600 hover:text-green-700 text-sm"
                onClick={handleAddOrderBook}
              >
                + Add Another Book
              </button>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="bg-green-600 text-white px-4 py-2 rounded flex-1"
                  onClick={handleOrderSubmit}
                >
                  Place Order
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border flex-1"
                  onClick={() => setOrderModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded shadow p-4">
        <h3 className="text-lg font-bold mb-2 text-red-700">Inventory Table</h3>
        <table style={tableStyles}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8' }}>
              <th style={cellStyles}>Title</th>
              <th style={cellStyles}>Author</th>
              <th style={cellStyles}>Price</th>
              <th style={cellStyles}>Stock</th>
              <th style={cellStyles}>Image</th>
              <th style={cellStyles}>Description</th>
              <th style={cellStyles}>Category</th>
              <th style={cellStyles}>Supplier</th>
              <th style={cellStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedBooks.map((b) => (
              <tr key={b._id}>
                <td style={cellStyles}>{b.title}</td>
                <td style={cellStyles}>{b.author}</td>
                <td style={cellStyles}>₱{Number(b.price).toFixed(2)}</td>
                <td style={cellStyles}>{b.stock}</td>
                <td style={cellStyles}>
                  {b.image ? (
                    <img
                      src={b.image.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api','') || 'http://localhost:5000'}${b.image}` : b.image}
                      alt={b.title}
                      style={imageStyles}
                    />
                  ) : (
                    <span style={{ color: 'gray' }}>No image</span>
                  )}
                </td>
                <td style={cellStyles}>{b.description}</td>
                <td style={cellStyles}>{b.category}</td>
                <td style={cellStyles}>
                  {b.suppliers.map(sid =>
                    allSuppliers.find(s => s._id === sid)?.companyName ||
                    allSuppliers.find(s => s._id === sid)?.name ||
                    allSuppliers.find(s => s._id === sid)?.email ||
                    'Unknown'
                  ).join(', ')}
                </td>
                <td style={cellStyles}>
                  <button onClick={() => handleEdit(b)} style={{ color: 'blue', marginRight: '8px' }}>Edit</button>
                  <button onClick={() => handleDelete(b._id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
