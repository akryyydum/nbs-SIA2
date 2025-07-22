import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Use Vite env variable if set, otherwise fallback to current origin for LAN support
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${'https://nbs-sia2.onrender.com'}/api`,
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
  const [newArrivals, setNewArrivals] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState(''); // 'left' or 'right'
  const { user } = useAuth();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  // Remove this line:
  // const search = searchParams.get('search')?.toLowerCase() || '';
  // Use only the controlled state below:
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Move fetchBooks outside useEffect so it can be reused
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/books');
      setBooks(res.data);
      // Extract unique categories from books
      const cats = Array.from(new Set(res.data.map(b => b.category).filter(Boolean)));
      setCategories(cats);

      // Group books by title and author for new arrivals (no duplicates)
      const groupedArrivalsMap = {};
      res.data.forEach(book => {
        const key = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`;
        if (!groupedArrivalsMap[key]) {
          groupedArrivalsMap[key] = { ...book, stock: Number(book.stock) || 0 };
        } else {
          groupedArrivalsMap[key].stock += Number(book.stock) || 0;
        }
      });
      // Sort by createdAt descending, fallback to _id if no createdAt, then slice top 6
      const groupedArrivals = Object.values(groupedArrivalsMap)
        .sort((a, b) =>
          (new Date(b.createdAt || b._id)) - (new Date(a.createdAt || a._id))
        )
        .slice(0, 6);
      setNewArrivals(groupedArrivals);
    } catch (err) {
      setBooks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
    // Fetch suppliers from both /suppliers and users with supplier department role
    Promise.all([
      API.get('/suppliers'),
      API.get('/users')
    ]).then(([supRes, userRes]) => {
      const supplierUsers = (userRes.data || []).filter(u => u.role === 'supplier department');
      const merged = [
        ...supRes.data,
        ...supplierUsers.map(u => ({
          _id: u._id,
          companyName: u.name || u.email || u._id,
          fromUser: true
        }))
      ];
      setSuppliers(merged);
    }).catch(() => {});
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
      // Notify Navbar to update cart
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      alert('Failed to add to cart');
    }
  };

  // Carousel navigation handlers
  const handlePrev = () => {
    setCarouselDirection('left');
    setCarouselIndex(i => (i === 0 ? newArrivals.length - 1 : i - 1));
  };
  const handleNext = () => {
    setCarouselDirection('right');
    setCarouselIndex(i => (i === newArrivals.length - 1 ? 0 : i + 1));
  };

  // Group books by title and author, sum stocks, and join supplier names
  const groupedBooksMap = {};
  books.forEach(book => {
    const key = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`;
    if (!groupedBooksMap[key]) {
      groupedBooksMap[key] = { ...book, stock: Number(book.stock) || 0, suppliers: new Set() };
    } else {
      groupedBooksMap[key].stock += Number(book.stock) || 0;
    }
    // Add all supplier IDs from both book.supplier and book.suppliers
    if (book.supplier) groupedBooksMap[key].suppliers.add(book.supplier);
    if (Array.isArray(book.suppliers)) {
      book.suppliers.forEach(sid => groupedBooksMap[key].suppliers.add(sid));
    }
  });
  const groupedBooks = Object.values(groupedBooksMap).map(b => ({
    ...b,
    suppliers: Array.from(b.suppliers)
  }));

  // Filtering logic (now use groupedBooks instead of books)
  const filteredBooks = groupedBooks.filter(book => {
    // Search filter
    const matchesSearch = !search ||
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase()) ||
      book.description?.toLowerCase().includes(search.toLowerCase());
    // Category filter
    const matchesCategory = !selectedCategory || book.category === selectedCategory;
    // Price filter
    const price = Number(book.price);
    const matchesMin = !minPrice || price >= Number(minPrice);
    const matchesMax = !maxPrice || price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  return (
    <div className="p-8 min-h-screen bg-[#f8f5f2] font-poppins">
      {/* Hero Section with Search Bar */}
      <div className="max-w-3xl mx-auto mb-12 mt-4 text-center">
        <div className="text-xs text-gray-500 mb-2 tracking-wide">Find your next great read.</div>
        <div className="text-3xl md:text-4xl font-bold mb-6">
          <span className="text-black">Can't find the </span>
          <span className="text-red-600">book?</span>
        </div>
        {/* Search Bar Styled */}
        <form
          className="flex items-center bg-white rounded-2xl shadow border border-gray-200 px-2 py-1 max-w-2xl mx-auto"
          style={{ boxShadow: '0 4px 24px 0 rgba(31,38,135,0.08)' }}
          onSubmit={e => {
            e.preventDefault();
            // Update the URL search param for consistency
            const params = new URLSearchParams(location.search);
            if (search) {
              params.set('search', search);
            } else {
              params.delete('search');
            }
            window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
          }}
        >
          <select
            className="bg-transparent border-none outline-none px-4 py-3 text-gray-700 text-base font-medium"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            tabIndex={0}
          >
            <option value="">Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            className="flex-1 px-4 py-3 text-base bg-transparent outline-none border-none"
            placeholder="The Martians"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 0 }}
            tabIndex={0}
          />
          <button
            type="submit"
            className="px-4 py-2 text-red-600 hover:text-red-800 transition"
            aria-label="Search"
            tabIndex={0}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </form>
      </div>
      {/* New Arrivals Carousel */}
      {newArrivals.length > 0 && !search && (
        <div className="mb-16">
          <h2
            className="text-4xl font-bold mb-8 flex items-center gap-3 justify-center text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-black to-red-700 animate-gradient-x"
            style={{
              backgroundSize: '200% 200%',
              animation: 'gradient-x 3s ease-in-out infinite',
              fontFamily: `'Brush Script MT', cursive`
            }}
          >
            New Arrivals
          </h2>
          <div className="relative flex items-center justify-center">
            {/* Carousel Left Arrow */}
            <button
              className="absolute left-0 z-10 bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-900 transition text-xl"
              onClick={handlePrev}
              aria-label="Previous"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <FaChevronLeft />
            </button>
            {/* Carousel Cards */}
            <div className="flex items-center justify-center w-full max-w-6xl">
              {/* Previous Card (left, rotated) */}
              <div
                className="hidden md:block w-80 h-[420px] mx-2 bg-white rounded-2xl shadow-lg transform transition-transform duration-300 scale-95 -rotate-6 opacity-70 z-0 animate-carousel-side"
                style={{
                  pointerEvents: 'none',
                  ...(newArrivals.length > 1
                    ? {}
                    : { opacity: 0, visibility: 'hidden' })
                }}
              >
                {newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length]?.image && (
                  <img
                    src={
                      newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length].image.startsWith('http')
                        ? newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length].image
                        : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://nbs-sia2.onrender.com'}${newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length].image.startsWith('/') ? '' : '/'}${newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length].image}`
                    }
                    alt=""
                    className="h-48 w-full object-cover rounded-t-2xl"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1">{newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length]?.title}</h3>
                  <div className="text-xs text-gray-500 mb-2">{newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length]?.author}</div>
                  <div className="text-xs text-gray-400 mb-2 line-clamp-2">{newArrivals[(carouselIndex - 1 + newArrivals.length) % newArrivals.length]?.description}</div>
                </div>
              </div>
              {/* Center Card (active) */}
              <div
                className={`w-96 h-[460px] mx-2 bg-white rounded-2xl shadow-2xl transform transition-transform duration-300 scale-105 z-10 flex flex-col ${
                  carouselDirection === 'left'
                    ? 'animate-carousel-slide-left'
                    : carouselDirection === 'right'
                    ? 'animate-carousel-slide-right'
                    : 'animate-carousel-center'
                }`}
                style={{
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.18)',
  willChange: 'transform, opacity',
}}
                key={carouselIndex}
                onAnimationEnd={() => setCarouselDirection('')}
              >
                {newArrivals[carouselIndex]?.image && (
                  <img
                    src={
                      newArrivals[carouselIndex].image.startsWith('http')
                        ? newArrivals[carouselIndex].image
                        : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://nbs-sia2.onrender.com'}${newArrivals[carouselIndex].image.startsWith('/') ? '' : '/'}${newArrivals[carouselIndex].image}`
                    }
                    alt={newArrivals[carouselIndex].title}
                    className="h-56 w-full object-cover rounded-t-2xl"
                  />
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-red-200 text-black text-xs px-3 py-1 rounded-full font-semibold">
                      {newArrivals[carouselIndex].category || 'New'}
                    </span>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-semibold">
                      {newArrivals[carouselIndex].author}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{newArrivals[carouselIndex].title}</h3>
                  <div className="text-gray-600 text-sm mb-3 line-clamp-3">{newArrivals[carouselIndex].description}</div>
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="text-lg font-bold text-black mb-2">₱{Number(newArrivals[carouselIndex].price).toFixed(2)}</div>
                    <button
                      className="w-full py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition"
                      onClick={() => {
                        setModalBook(newArrivals[carouselIndex]);
                        setModalQty(1);
                      }}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
              {/* Next Card (right, rotated) */}
              <div
                className="hidden md:block w-80 h-[420px] mx-2 bg-white rounded-2xl shadow-lg transform transition-transform duration-300 scale-95 rotate-6 opacity-70 z-0 animate-carousel-side"
                style={{
                  pointerEvents: 'none',
                  ...(newArrivals.length > 1
                    ? {}
                    : { opacity: 0, visibility: 'hidden' })
                }}
              >
                {newArrivals[(carouselIndex + 1) % newArrivals.length]?.image && (
                  <img
                    src={
                      newArrivals[(carouselIndex + 1) % newArrivals.length].image.startsWith('http')
                        ? newArrivals[(carouselIndex + 1) % newArrivals.length].image
                        : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://nbs-sia2.onrender.com'}${newArrivals[(carouselIndex + 1) % newArrivals.length].image.startsWith('/') ? '' : '/'}${newArrivals[(carouselIndex + 1) % newArrivals.length].image}`
                    }
                    alt=""
                    className="h-48 w-full object-cover rounded-t-2xl"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1">{newArrivals[(carouselIndex + 1) % newArrivals.length]?.title}</h3>
                  <div className="text-xs text-gray-500 mb-2">{newArrivals[(carouselIndex + 1) % newArrivals.length]?.author}</div>
                  <div className="text-xs text-gray-400 mb-2 line-clamp-2">{newArrivals[(carouselIndex + 1) % newArrivals.length]?.description}</div>
                </div>
              </div>
            </div>
            {/* Carousel Right Arrow */}
            <button
              className="absolute right-0 z-10 bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-900 transition text-xl"
              onClick={handleNext}
              aria-label="Next"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              <FaChevronRight />
            </button>
            {/* Carousel Dots */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 mt-4">
              {newArrivals.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full ${carouselIndex === idx ? 'bg-purple-700' : 'bg-gray-300'} transition`}
                  onClick={() => {
                    setCarouselDirection(idx > carouselIndex ? 'right' : 'left');
                    setCarouselIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{ outline: 'none', border: 'none' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-8 text-black">All Books</h2>
      {/* Filters (hide category filter since it's in the search bar now) */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
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
                      : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://nbs-sia2.onrender.com'}${book.image.startsWith('/') ? '' : '/'}${book.image}`
                  }
                  alt={book.title}
                  className="h-40 w-32 object-cover rounded-lg mb-4 shadow"
                />
              )}
              <div className="w-full flex-1 flex flex-col items-center">
                <h3 className="text-lg font-bold text-black mb-1 text-center">{book.title}</h3>
                <div className="text-sm text-gray-700 mb-2 text-center">{book.author}</div>
                <div className="text-black font-semibold text-lg mb-2">₱{Number(book.price).toFixed(2)}</div>
                <div className="text-xs text-gray-500 mb-2 text-center line-clamp-2">{book.description}</div>
                {/* Category display */}
                {book.category && (
                  <div className="text-xs text-gray-400 mb-2 text-center">Category: {book.category}</div>
                )}
                <div
                  className={`text-xs mb-2 text-center ${
                    book.stock === 0
                      ? 'text-red-600 font-bold'
                      : book.stock <= 3
                        ? 'text-yellow-600 font-bold'
                        : 'text-gray-400'
                  }`}
                >
                  Stock: {book.stock}
                </div>
                {/* Add to Cart Button */}
                <button
                  className="mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                  onClick={e => {
                    e.stopPropagation();
                    handleAddToCart(book);
                  }}
                  disabled={book.stock === 0}
                  style={book.stock === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
            onClick={() => {
              const modal = document.querySelector('[data-modal]');
              if (modal) {
                modal.classList.remove('animate-slide-in');
                modal.classList.add('animate-slide-out');
              } else {
                setModalBook(null);
              }
            }}
          />
          <div
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out animate-slide-in"
            style={{ maxWidth: '100vw' }}
            onAnimationEnd={e => {
              if (e.animationName === 'slide-out') setModalBook(null);
            }}
            data-modal={modalBook ? 'in' : 'out'}
          >
            <button
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black"
              onClick={() => {
                const modal = document.querySelector('[data-modal]');
                if (modal) {
                  modal.classList.remove('animate-slide-in');
                  modal.classList.add('animate-slide-out');
                } else {
                  setModalBook(null);
                }
              }}
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
                      : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'https://nbs-sia2.onrender.com'}${modalBook.image.startsWith('/') ? '' : '/'}${modalBook.image}`
                  }
                  alt={modalBook.title}
                  className="h-48 w-36 object-cover rounded-lg mb-4 mx-auto shadow"
                />
              )}
              <h3 className="text-2xl font-bold text-black mb-2 text-center">{modalBook.title}</h3>
              <div className="text-md text-gray-700 mb-2 text-center">{modalBook.author}</div>
              <div className="text-black font-semibold text-xl mb-2 text-center">₱{Number(modalBook.price).toFixed(2)}</div>
              <div className="text-sm text-gray-500 mb-4 text-center">{modalBook.description}</div>
              {modalBook.category && (
                <div className="text-xs text-gray-400 mb-2 text-center">Category: {modalBook.category}</div>
              )}
              {/* Supplier display in modal */}
              {modalBook.suppliers && user?.role !== 'customer' && (
                <div className="text-xs text-gray-400 mb-4 text-center">
                  Supplier: {
                    modalBook.suppliers
                      .map(sid => suppliers.find(s => s._id === sid)?.companyName || sid)
                      .join(', ')
                  }
                </div>
              )}
              <div
                className={`text-xs mb-4 text-center ${
                  modalBook.stock === 0
                    ? 'text-red-600 font-bold'
                    : modalBook.stock <= 3
                      ? 'text-yellow-600 font-bold'
                      : 'text-gray-400'
                }`}
              >
                Stock: {modalBook.stock}
              </div>
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
                style={modalBook.stock === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {modalBook.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
          {/* Modal slide-in and slide-out animation */}
          <style>
            {`
              @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slide-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
              }
              .animate-slide-in {
                animation: slide-in 0.4s cubic-bezier(0.4,0,0.2,1) both;
              }
              .animate-slide-out {
                animation: slide-out 0.4s cubic-bezier(0.4,0,0.2,1) both;
              }
            `}
          </style>
        </>
      )}
      {/* Animations for carousel */}
      <style>
        {`
          /* Entry & fade animations */
.animate-fade-in-up { animation: fadeInUp 0.6s ease-in-out; }
.animate-fade-in-down { animation: fadeInDown 0.6s ease-in-out; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Carousel slide animations */
.animate-carousel-center {
  animation: carouselCenter 0.6s ease-in-out;
}
@keyframes carouselCenter {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-carousel-side {
  animation: carouselSide 0.6s ease-in-out;
}
@keyframes carouselSide {
  from { opacity: 0; transform: scale(0.9) translateY(15px); }
  to { opacity: 0.7; transform: scale(0.95) translateY(0); }
}

.animate-carousel-slide-left {
  animation: carouselSlideLeft 0.5s ease-in-out;
}
.animate-carousel-slide-right {
  animation: carouselSlideRight 0.5s ease-in-out;
}
@keyframes carouselSlideLeft {
  from { opacity: 0; transform: translateX(-60px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes carouselSlideRight {
  from { opacity: 0; transform: translateX(60px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

/* Modal */
@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in {
  animation: slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

        `}
      </style>
    </div>
  );
};

export default Products;
