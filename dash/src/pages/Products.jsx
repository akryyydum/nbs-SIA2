import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Use Vite env variable if set, otherwise fallback to current origin for LAN support
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`,
});

const Products = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [modalBook, setModalBook] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const { user } = useAuth();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get('search')?.toLowerCase() || '';

  // Move fetchBooks outside useEffect so it can be reused
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/books');
      setBooks(res.data);
      // Extract unique categoriexs from books
      const cats = Array.from(new Set(res.data.map(b => b.category).filter(Boolean)));
      setCategories(cats);
    } catch (err) {
      setBooks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
    // Fetch suppliers for display
    API.get('/suppliers').then(res => setSuppliers(res.data)).catch(() => {});
  }, [fetchBooks]);

  // Add to cart handler (calls backend API, increments quantity)
  const handleAddToCart = async (book, qty = 1) => {
    if (!user?.token) {
      alert('Please login to add to cart.');
      return;
    }
    try {
      // Always use API instance for LAN compatibility
      const res = await API.get('/cart', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      let items = res.data.items || [];
      // Find if book already in cart
      const idx = items.findIndex(item =>
        (item.book && (item.book._id === book._id || item.book === book._id))
      );
      if (idx !== -1) {
        items[idx].quantity = (items[idx].quantity || 1) + qty;
      } else {
        items.push({ book: book._id, quantity: qty });
      }
      // Save updated cart to backend
      await API.post('/cart', { items }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(`Added "${book.title}" to cart!`);
    } catch (err) {
      alert('Failed to add to cart');
    }
  };

  // Filtering logic
  const filteredBooks = books.filter(book => {
    // Search filter
    const matchesSearch = !search ||
      book.title?.toLowerCase().includes(search) ||
      book.author?.toLowerCase().includes(search) ||
      book.description?.toLowerCase().includes(search);
    // Category filter
    const matchesCategory = !selectedCategory || book.category === selectedCategory;
    // Price filter
    const price = Number(book.price);
    const matchesMin = !minPrice || price >= Number(minPrice);
    const matchesMax = !maxPrice || price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <h2 className="text-2xl font-bold mb-8 text-black">All Books</h2>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* Category Filter */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {/* Price Range Filter */}
        <input
          type="number"
          min="0"
          placeholder="Min Price"
          className="border border-gray-200 rounded-lg px-3 py-2 w-28"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          min="0"
          placeholder="Max Price"
          className="border border-gray-200 rounded-lg px-3 py-2 w-28"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
        />
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
        style={{
          background: 'rgba(255,255,255,0.10)',
          borderRadius: '1.5rem',
          padding: '2rem 1rem',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        }}
      >
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-12">Loading...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No books found</div>
        ) : (
          filteredBooks.map(book => (
            <div
              key={book._id}
              className="bg-white/60 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center p-6 transition hover:shadow-2xl cursor-pointer"
              style={{
                backdropFilter: 'blur(10px) saturate(180%)',
                WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
              onClick={() => {
                setModalBook(book);
                setModalQty(1);
              }}
            >
              {book.image && (
                <img
                  src={
                    book.image.startsWith('http')
                      ? book.image
                      : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || window.location.origin}${book.image.startsWith('/') ? '' : '/'}${book.image}`
                  }
                  alt={book.title}
                  className="h-40 w-32 object-cover rounded-lg mb-4 shadow"
                />
              )}
              <div className="w-full flex-1 flex flex-col items-center">
                <h3 className="text-lg font-bold text-black mb-1 text-center">{book.title}</h3>
                <div className="text-sm text-gray-700 mb-2 text-center">{book.author}</div>
                <div className="text-black font-semibold text-lg mb-2">${Number(book.price).toFixed(2)}</div>
                <div className="text-xs text-gray-500 mb-2 text-center line-clamp-2">{book.description}</div>
                {/* Category display */}
                {book.category && (
                  <div className="text-xs text-gray-400 mb-2 text-center">Category: {book.category}</div>
                )}
                {/* Supplier display */}
                {book.supplier && (
                  <div className="text-xs text-gray-400 mb-2 text-center">
                    Supplier: {suppliers.find(s => s._id === book.supplier)?.companyName || book.supplier}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-auto mb-2">Stock: {book.stock}</div>
                {/* Add to Cart Button */}
                <button
                  className="mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                  onClick={e => {
                    e.stopPropagation();
                    handleAddToCart(book);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalBook && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setModalBook(null)}
          />
          <div
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out animate-slide-in"
            style={{ maxWidth: '100vw' }}
          >
            <button
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black"
              onClick={() => setModalBook(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="p-8 flex flex-col h-full">
              {modalBook.image && (
                <img
                  src={
                    modalBook.image.startsWith('http')
                      ? modalBook.image
                      : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || window.location.origin}${modalBook.image.startsWith('/') ? '' : '/'}${modalBook.image}`
                  }
                  alt={modalBook.title}
                  className="h-48 w-36 object-cover rounded-lg mb-4 mx-auto shadow"
                />
              )}
              <h3 className="text-2xl font-bold text-black mb-2 text-center">{modalBook.title}</h3>
              <div className="text-md text-gray-700 mb-2 text-center">{modalBook.author}</div>
              <div className="text-black font-semibold text-xl mb-2 text-center">${Number(modalBook.price).toFixed(2)}</div>
              <div className="text-sm text-gray-500 mb-4 text-center">{modalBook.description}</div>
              {modalBook.category && (
                <div className="text-xs text-gray-400 mb-2 text-center">Category: {modalBook.category}</div>
              )}
              {/* Supplier display in modal */}
              {modalBook.supplier && (
                <div className="text-xs text-gray-400 mb-4 text-center">
                  Supplier: {suppliers.find(s => s._id === modalBook.supplier)?.companyName || modalBook.supplier}
                </div>
              )}
              <div className="text-xs text-gray-400 mb-4 text-center">Stock: {modalBook.stock}</div>
              {/* Quantity Selector */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm">Quantity:</span>
                <button
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setModalQty(q => Math.max(1, q - 1))}
                  disabled={modalQty <= 1}
                >-</button>
                <input
                  type="number"
                  min="1"
                  max={modalBook.stock}
                  value={modalQty}
                  onChange={e => setModalQty(Math.max(1, Math.min(Number(e.target.value), modalBook.stock)))}
                  className="w-12 text-center border rounded"
                />
                <button
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setModalQty(q => Math.min((modalBook.stock || 99), q + 1))}
                  disabled={modalQty >= (modalBook.stock || 99)}
                >+</button>
              </div>
              <button
                className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-lg font-semibold"
                onClick={() => {
                  handleAddToCart(modalBook, modalQty);
                  setModalBook(null);
                }}
                disabled={modalBook.stock === 0}
              >
                {modalBook.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
          {/* Modal slide-in animation */}
          <style>
            {`
              @keyframes slide-in {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slide-in {
                animation: slide-in 0.3s cubic-bezier(0.4,0,0.2,1) both;
              }
            `}
          </style>
        </>
      )}
    </div>
  );
};

export default Products;
