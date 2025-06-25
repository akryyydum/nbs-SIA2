// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const images = [
  "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
  "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg",
  "https://images.pexels.com/photos/12064/pexels-photo-12064.jpeg"
];

const DashboardPage = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(false);
  const [newArrivals, setNewArrivals] = useState([]);
  const [arrivalsPage, setArrivalsPage] = useState(0);
  const [arrivalsDirection, setArrivalsDirection] = useState(0); // -1 for left, 1 for right

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
          '/books?sort=-createdAt&limit=20'
      )
      .then(res => setNewArrivals(res.data))
      .catch(() => setNewArrivals([]));
  }, []);

  const ARRIVALS_PER_PAGE = 5;
  const arrivalsTotalPages = Math.ceil(newArrivals.length / ARRIVALS_PER_PAGE);

  const handleArrivalsPrev = () => {
    setArrivalsDirection(-1);
    setArrivalsPage((prev) => (prev === 0 ? arrivalsTotalPages - 1 : prev - 1));
  };

  const handleArrivalsNext = () => {
    setArrivalsDirection(1);
    setArrivalsPage((prev) => (prev === arrivalsTotalPages - 1 ? 0 : prev + 1));
  };

  const arrivalsToShow = newArrivals.slice(
    arrivalsPage * ARRIVALS_PER_PAGE,
    arrivalsPage * ARRIVALS_PER_PAGE + ARRIVALS_PER_PAGE
  );

  return (
    <div className="min-h-screen w-screen h-screen flex flex-col bg-white font-poppins relative overflow-hidden">
      {/* Animated blobs background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-200 opacity-40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-100 opacity-40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-200 opacity-30 rounded-full blur-2xl animate-pulse-fast -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Carousel Section */}
      <div className="flex items-center justify-center w-full h-[32vh] sm:h-[36vh] md:h-[40vh] lg:h-[30vh] xl:h-[35vh]">
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {images.map((img, idx) => (
            <img
              key={img}
              src={img}
              alt={`carousel-${idx}`}
              className={`w-full h-full object-cover absolute top-0 left-0 transition-transform duration-700 ease-in-out
                ${idx === current ? 'z-10 translate-x-0 opacity-100' : idx < current ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}
              `}
              style={{
                transitionProperty: 'transform, opacity',
              }}
            />
          ))}
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-2 sm:px-4">
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center drop-shadow mb-4 sm:mb-6 animate-fade-in">
          New Arrivals
        </div>
        <div className="relative w-full max-w-5xl flex items-center">
          {/* Left arrow */}
          <button
            className="absolute left-0 z-10 bg-white/80 hover:bg-white text-black rounded-full shadow p-2 transition disabled:opacity-30"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleArrivalsPrev}
            disabled={arrivalsTotalPages <= 1}
            aria-label="Previous"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Carousel */}
          <div className="w-full flex overflow-hidden justify-center">
            {arrivalsToShow.length === 0 ? (
              <div className="w-full text-center text-gray-400 py-8 animate-fade-in">
                No new arrivals
              </div>
            ) : (
              <div
                className="flex w-full gap-4 sm:gap-6 justify-center transition-transform duration-500"
                style={{
                  transform: `translateX(${arrivalsDirection === 0 ? 0 : arrivalsDirection === 1 ? '100%' : '-100%'})`,
                  animation: arrivalsDirection !== 0 ? `slideArrivals${arrivalsDirection === 1 ? 'Left' : 'Right'} 0.5s forwards` : undefined
                }}
                onAnimationEnd={() => setArrivalsDirection(0)}
              >
                {arrivalsToShow.map((book, idx) => (
                  <div
                    key={book._id || idx}
                    className="bg-white/70 rounded-xl shadow border border-gray-800 flex flex-col items-center p-3 sm:p-4 opacity-100 animate-fade-in-up min-w-[140px] max-w-[180px] flex-1"
                    style={{
                      animationDelay: `${idx * 0.1 + 0.2}s`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {book.image && (
                      <img
                        src={book.image}
                        alt={book.title}
                        className="h-28 w-20 sm:h-32 sm:w-24 object-cover rounded mb-2 shadow opacity-100 animate-zoom-in"
                        style={{
                          animationDelay: `${idx * 0.1 + 0.3}s`,
                          animationFillMode: 'forwards'
                        }}
                      />
                    )}
                    <div className="w-full flex-1 flex flex-col items-center text-center">
                      <div className="text-sm sm:text-base font-bold text-black mb-1 line-clamp-2">
                        {book.title}
                      </div>
                      <div className="text-xs text-gray-700 mb-1">{book.author}</div>
                      <div className="text-black font-semibold text-xs sm:text-sm mb-1">
                        ${Number(book.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Right arrow */}
          <button
            className="absolute right-0 z-10 bg-white/80 hover:bg-white text-black rounded-full shadow p-2 transition disabled:opacity-30"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleArrivalsNext}
            disabled={arrivalsTotalPages <= 1}
            aria-label="Next"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {arrivalsTotalPages > 1 && (
          <div className="flex justify-center mt-3 gap-2">
            {Array.from({ length: arrivalsTotalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${idx === arrivalsPage ? 'bg-red-600' : 'bg-gray-300'} transition`}
                onClick={() => setArrivalsPage(idx)}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Animation keyframes for sliding
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideArrivalsLeft {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes slideArrivalsRight {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
`;
if (typeof window !== 'undefined' && !document.getElementById('arrivals-carousel-anim')) {
  style.id = 'arrivals-carousel-anim';
  document.head.appendChild(style);
}

export default DashboardPage;
