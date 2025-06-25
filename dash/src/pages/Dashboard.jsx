// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const images = [
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80"
];

const DashboardPage = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(false);
  const [newArrivals, setNewArrivals] = useState([]);

  // Auto-slide every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % images.length);
        setFade(false);
      }, 1000); // Match transition duration
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch latest books
  useEffect(() => {
    axios
      .get(
        (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') +
          '/books?sort=-createdAt&limit=4'
      )
      .then(res => setNewArrivals(res.data))
      .catch(() => setNewArrivals([]));
  }, []);

  return (
    <div className="min-h-screen w-screen h-screen flex flex-col bg-white font-poppins relative overflow-hidden">
      {/* Animated blobs background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-200 opacity-40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-100 opacity-40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-200 opacity-30 rounded-full blur-2xl animate-pulse-fast -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Carousel Section */}
      <div className="flex items-center justify-center w-full h-1/3">
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={images[current]}
            alt={`carousel-${current}`}
            className={`w-full h-full object-cover transition-all duration-1000 ease-in-out transform ${
              fade ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          />
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full h-1/2 px-4">
        <div className="text-3xl md:text-4xl font-bold text-black text-center drop-shadow mb-6 animate-fade-in">
          New Arrivals
        </div>
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-8 animate-fade-in">
              No new arrivals
            </div>
          ) : (
            newArrivals.map((book, idx) => (
              <div
                key={book._id || idx}
                className="bg-white/70 rounded-xl shadow border border-gray-800 flex flex-col items-center p-4 opacity-100 animate-fade-in-up"
                style={{
                  animationDelay: `${idx * 0.15 + 0.3}s`,
                  animationFillMode: 'forwards'
                }}
              >
                {book.image && (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="h-32 w-24 object-cover rounded mb-2 shadow opacity-100 animate-zoom-in"
                    style={{
                      animationDelay: `${idx * 0.15 + 0.5}s`,
                      animationFillMode: 'forwards'
                    }}
                  />
                )}
                <div className="w-full flex-1 flex flex-col items-center text-center">
                  <div className="text-base font-bold text-black mb-1 line-clamp-2">
                    {book.title}
                  </div>
                  <div className="text-xs text-gray-700 mb-1">{book.author}</div>
                  <div className="text-black font-semibold text-sm mb-1">
                    ${Number(book.price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
