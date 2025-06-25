import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

// Use Vite env variable if set, otherwise fallback to localhost
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

const Products = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get('search')?.toLowerCase() || '';

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const res = await API.get('/books');
        setBooks(res.data);
        // Extract unique categories from books
        const cats = Array.from(new Set(res.data.map(b => b.category).filter(Boolean)));
        setCategories(cats);
      } catch (err) {
      }
      setLoading(false);
    };
    fetchBooks();
  }, []);

  // Add to cart handler (syncs with localStorage, increments quantity)
  const handleAddToCart = (book) => {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch {}
    const idx = cart.findIndex(item => item._id === book._id);
    if (idx !== -1) {
      cart[idx].quantity = (cart[idx].quantity || 1) + 1;
    } else {
      cart.push({ ...book, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Added "${book.title}" to cart!`);
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
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-8 text-red-700">All Books</h2>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* Category Filter */}
        <select
          className="border border-red-200 rounded-lg px-3 py-2"
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
          className="border border-red-200 rounded-lg px-3 py-2 w-28"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          min="0"
          placeholder="Max Price"
          className="border border-red-200 rounded-lg px-3 py-2 w-28"
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
              className="bg-white/60 rounded-2xl shadow-lg border border-red-100 flex flex-col items-center p-6 transition hover:shadow-2xl"
              style={{
                backdropFilter: 'blur(10px) saturate(180%)',
                WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {book.image && (
                <img
                  src={book.image}
                  alt={book.title}
                  className="h-40 w-32 object-cover rounded-lg mb-4 shadow"
                />
              )}
              <div className="w-full flex-1 flex flex-col items-center">
                <h3 className="text-lg font-bold text-red-700 mb-1 text-center">{book.title}</h3>
                <div className="text-sm text-gray-700 mb-2 text-center">{book.author}</div>
                <div className="text-red-600 font-semibold text-lg mb-2">${Number(book.price).toFixed(2)}</div>
                <div className="text-xs text-gray-500 mb-2 text-center line-clamp-2">{book.description}</div>
                {/* Category display */}
                {book.category && (
                  <div className="text-xs text-gray-400 mb-2 text-center">Category: {book.category}</div>
                )}
                <div className="text-xs text-gray-400 mt-auto mb-2">Stock: {book.stock}</div>
                {/* Add to Cart Button */}
                <button
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  onClick={() => handleAddToCart(book)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Products;
