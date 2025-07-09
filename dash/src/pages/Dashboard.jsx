// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';

const images = [
  "https://images.pexels.com/photos/159711/books-bookstore-book_reading-159711.jpeg",
  "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg",
  "https://images.pexels.com/photos/12064/pexels-photo-12064.jpeg"
];

const businesses = [
  {
    name: "Blended",
    url: "http://192.168.9.7:5173",
    img: "/blended.jpg"
  },
  {
    name: "Tara laba",
    url: "http://192.168.9.27:5173",
    img: "/tl.jpg"
  },
  {
    name: "Dental Clinic",
    url: "http://192.168.9.35:5173",
    img: "/dentist.png"
  },
  {
    name: "Jollibee",
    url: "http://192.168.9.37:5173",
    img: "https://1000logos.net/wp-content/uploads/2021/05/Jollibee-logo.png",
    imgClass: "bg-white"
  },
  {
    name: "PNB",
    url: "http://192.168.9.23:5173",
    img: "https://www.pds.com.ph/wp-content/uploads/2018/12/PNB-Logo-Short-YouFirst-011117-FC-HQ-1024x676.png",
    imgClass: "bg-white"
  },
  {
    name: "ITBYTES",
    url: "http://192.168.9.4:5173",
    img: "/it.jpg"
  }
];

const DashboardPage = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(false);
  const [newArrivals, setNewArrivals] = useState([]);
  const [arrivalsPage, setArrivalsPage] = useState(0);
  const [arrivalsDirection, setArrivalsDirection] = useState(0); // -1 for left, 1 for right

  // Animation state for arrivals carousel
  const [animating, setAnimating] = useState(false);
  const [prevArrivalsPage, setPrevArrivalsPage] = useState(arrivalsPage);

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
        `${import.meta.env.VITE_API_BASE_URL || window.location.origin + '/api'}/books?sort=-createdAt&limit=20`
      )
      .then(res => setNewArrivals(res.data))
      .catch(() => setNewArrivals([]));
  }, []);

  const ARRIVALS_PER_PAGE = 5;
  const arrivalsTotalPages = Math.ceil(newArrivals.length / ARRIVALS_PER_PAGE);

  // Track previous page to determine direction for animation
  useEffect(() => {
    setPrevArrivalsPage(arrivalsPage);
  }, [arrivalsPage]);

  // Animate on arrow click
  const handleArrivalsPrev = () => {
    if (arrivalsTotalPages <= 1 || animating) return;
    setArrivalsDirection(-1);
    setAnimating(true);
    setArrivalsPage((prev) => (prev === 0 ? arrivalsTotalPages - 1 : prev - 1));
  };

  const handleArrivalsNext = () => {
    if (arrivalsTotalPages <= 1 || animating) return;
    setArrivalsDirection(1);
    setAnimating(true);
    setArrivalsPage((prev) => (prev === arrivalsTotalPages - 1 ? 0 : prev + 1));
  };

  // For fluid animation, keep both old and new arrivals visible during transition
  const getArrivalsForPage = (page) =>
    newArrivals.slice(
      page * ARRIVALS_PER_PAGE,
      page * ARRIVALS_PER_PAGE + ARRIVALS_PER_PAGE
    );

  const arrivalsToShow = newArrivals.slice(
    arrivalsPage * ARRIVALS_PER_PAGE,
    arrivalsPage * ARRIVALS_PER_PAGE + ARRIVALS_PER_PAGE
  );

  // Compute number 1 selling book from newArrivals
  const numberOneSelling = (() => {
    if (!newArrivals.length) return null;
    // Find the book with the highest sales (assuming 'sold' field exists)
    // If not, just pick the first as a fallback
    return newArrivals.reduce((top, book) =>
      (book.sold || 0) > (top.sold || 0) ? book : top, newArrivals[0]
    );
  })();

  const [businessStatus, setBusinessStatus] = useState({});

  useEffect(() => {
    // Check each business URL for up/down status
    businesses.forEach(biz => {
      fetch(biz.url, { mode: 'no-cors' })
        .then(() => {
          setBusinessStatus(prev => ({ ...prev, [biz.url]: 'up' }));
        })
        .catch(() => {
          setBusinessStatus(prev => ({ ...prev, [biz.url]: 'down' }));
        });
    });
  }, []);

  return (
   <div className="min-h-screen w-full flex flex-col bg-white font-poppins relative overflow-hidden">
      {/* Animated blobs background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-200 opacity-40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-100 opacity-40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-200 opacity-30 rounded-full blur-2xl animate-pulse-fast -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hero Banner Section */}
      <div className="w-full flex justify-center items-center py-8 px-2 sm:px-8 animate-fade-in">
        <div className="w-full max-w-7xl bg-white flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-8 gap-6 md:gap-0 relative overflow-hidden">
          {/* Left: Text */}
          <div className="flex-1 flex flex-col items-start z-10">
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black leading-tight mb-2">
              <div>LET'S</div>
              <div>EXPLORE <span className="relative inline-block">
                <span className="bg-red-300 px-1 pb-1 rounded-sm text-black animate-unique-hero">UNIQUE</span>
              </span></div>
              <div>BOOKS.</div>
            </div>
            <div className="text-gray-600 text-base sm:text-lg mb-5 mt-2">
              Discover influential and innovative reads for every book lover!
            </div>
            <button
              className="mt-2 px-6 py-2 bg-black text-white rounded-lg font-semibold shadow hover:bg-red-400 hover:text-black transition"
              onClick={() => window.location.href = '/products'}
            >
              Shop Now
            </button>
          </div>
          {/* Right: Book Image */}
          <div className="flex-1 flex justify-center items-center z-10">
            <img
              src="/books1.png"
              alt="Books Banner"
              className="w-80 h-80 md:w-[28rem] md:h-[28rem] object-contain"
              style={{ background: "transparent", boxShadow: "none", border: "none" }}
            />
          </div>
          {/* Decorative stars */}
          <div className="absolute top-6 left-6 text-gray-200 text-3xl select-none pointer-events-none">★</div>
          <div className="absolute bottom-8 right-12 text-gray-200 text-2xl select-none pointer-events-none">★</div>
          <div className="absolute top-1/2 left-1/2 text-gray-100 text-4xl select-none pointer-events-none" style={{transform: "translate(-50%, -50%)"}}>★</div>
        </div>
      </div>

      {/* Features Bar Section */}
      <div className="w-full bg-white py-6 border-b border-gray-200 flex justify-center animate-fade-in">
        <div className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-between gap-30 px-4">
          {/* Free Shipping */}
          <div className="flex flex-col items-center flex-1 min-w-[120px] feature-animate">
            <svg className="w-10 h-10 text-red-600 mb-2 feature-icon-animate" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path d="M3 17V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17h2a2 2 0 0 0 2-2v-3.5a1 1 0 0 0-.293-.707l-2.5-2.5A1 1 0 0 0 16 8.5V17z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor"/>
              <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"/>
            </svg>
            <div className="font-bold text-gray-900 text-lg">Free Shipping</div>
            <div className="text-gray-500 text-sm">Order Over ₱1000</div>
          </div>
          {/* Secure Payment */}
          <div className="flex flex-col items-center flex-1 min-w-[120px] feature-animate" style={{ animationDelay: '0.1s' }}>
            <svg className="w-10 h-10 text-red-600 mb-2 feature-icon-animate" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div className="font-bold text-gray-900 text-lg">Secure Payment</div>
            <div className="text-gray-500 text-sm">100% Secure Payment</div>
          </div>
          {/* Easy Returns */}
          <div className="flex flex-col items-center flex-1 min-w-[120px] feature-animate" style={{ animationDelay: '0.2s' }}>
            <svg className="w-10 h-10 text-red-600 mb-2 feature-icon-animate" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 1 0 9-9" stroke="currentColor" strokeWidth="2"/>
              <polyline points="3 7 3 12 8 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div className="font-bold text-gray-900 text-lg">Easy Returns</div>
            <div className="text-gray-500 text-sm">10 Days Returns</div>
          </div>
          {/* 24/7 Support */}
          <div className="flex flex-col items-center flex-1 min-w-[120px] feature-animate" style={{ animationDelay: '0.3s' }}>
            <svg className="w-10 h-10 text-red-600 mb-2 feature-icon-animate" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 15v-1a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="9" r="2" fill="currentColor"/>
            </svg>
            <div className="font-bold text-gray-900 text-lg">24/7 Support</div>
            <div className="text-gray-500 text-sm">Call Us Anytime</div>
          </div>
        </div>
      </div>

      {/* Number 1 Selling Section */}
      {numberOneSelling && (
        <div className="w-full flex justify-center mt-8 animate-fade-in">
          <div className="max-w-5xl w-full rounded-3xl shadow-lg flex flex-col md:flex-row-reverse items-center px-8 py-8 gap-8">
            {/* Book image on the right */}
            <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto">
              {numberOneSelling.image && (
                <img
                  src={numberOneSelling.image}
                  alt={numberOneSelling.title}
                  className="h-100 w-75 object-cover shadow-lg  bg-white"
                />
              )}
            </div>
            {/* Info on the left */}
            <div className="flex-1 flex flex-col items-start justify-center">
              <div className="uppercase bg-red-600 text-white px-4 py-1 rounded font-bold text-xs mb-3 tracking-widest shadow">
                #1 Best Seller
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-red-700 mb-2 flex items-center gap-2">
                <span className="text-3xl">🏆</span>
                {numberOneSelling.title}
              </div>
              <div className="text-lg text-red-800 font-semibold mb-1">{numberOneSelling.author}</div>
              <div className="text-base text-red-700 mb-3 line-clamp-2">{numberOneSelling.description || "This book is our top seller!"}</div>
              <div className="flex items-center gap-6 mt-2">
                <span className="text-2xl font-bold text-red-900">₱{Number(numberOneSelling.price).toFixed(2)}</span>
                {typeof numberOneSelling.sold === 'number' && (
                  <span className="text-red-700 text-base font-medium bg-red-200 px-3 py-1 rounded-full">
                    Sold: {numberOneSelling.sold}
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <a
                  href={`/products/${numberOneSelling._id}`}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition"
                >
                  DETAILS
                </a>
                <a
                  href="/products"
                  className="px-6 py-2 bg-white text-red-700 border border-red-400 rounded-lg font-semibold shadow hover:bg-red-50 transition"
                >
                  SHOP NOW
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Arrivals Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-2 sm:px-4 animate-fade-in mt-10">
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center drop-shadow mb-4 sm:mb-6">
          New Arrivals
        </div>
        <div className="relative w-full max-w-5xl flex items-center" style={{ minHeight: 240 }}>
          {/* Left arrow */}
          <button
            className="absolute left-0 z-10 bg-white/80 hover:bg-white text-black rounded-full shadow p-2 transition disabled:opacity-30"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleArrivalsPrev}
            disabled={arrivalsTotalPages <= 1 || animating}
            aria-label="Previous"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Carousel */}
          <div className="w-full flex overflow-hidden justify-center relative" style={{ minHeight: 300 }}>
            {arrivalsToShow.length === 0 ? (
              <div className="w-full text-center text-gray-400 py-8">
                No new arrivals
              </div>
            ) : (
              <div className="relative w-full h-full">
                {/* Outgoing books */}
                {animating && (
                  <div
                    className={`absolute top-0 left-0 w-full flex gap-4 sm:gap-6 justify-center transition-transform duration-500`}
                    style={{
                      zIndex: 1,
                      transform: `translateX(0)`,
                      animation: arrivalsDirection === 1
                        ? 'slideArrivalsOutLeft 0.5s forwards'
                        : 'slideArrivalsOutRight 0.5s forwards'
                    }}
                  >
                    {getArrivalsForPage(
                      arrivalsDirection === 1
                        ? (arrivalsPage === 0 ? arrivalsTotalPages - 1 : arrivalsPage - 1)
                        : (arrivalsPage === arrivalsTotalPages - 1 ? 0 : arrivalsPage + 1)
                    ).map((book, idx) => (
                      <div
                        key={'out-' + (book._id || idx)}
                        className="bg-white/70 rounded-xl shadow border border-gray-800 flex flex-col items-center p-3 sm:p-4 opacity-100 min-w-[140px] max-w-[180px] flex-1"
                      >
                        {book.image && (
                          <img
                            src={book.image}
                            alt={book.title}
                            className="h-28 w-20 sm:h-32 sm:w-24 object-cover rounded mb-2 shadow opacity-100"
                          />
                        )}
                        <div className="w-full flex-1 flex flex-col items-center text-center">
                          <div className="text-sm sm:text-base font-bold text-black mb-1 line-clamp-2">
                            {book.title}
                          </div>
                          <div className="text-xs text-gray-700 mb-1">{book.author}</div>
                          <div className="text-black font-semibold text-xs sm:text-sm mb-1">
                            ₱{Number(book.price).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Incoming books */}
                <div
                  className={`absolute top-0 left-0 w-full flex gap-4 sm:gap-6 justify-center transition-transform duration-500`}
                  style={{
                    zIndex: 2,
                    animation: animating
                      ? (arrivalsDirection === 1
                        ? 'slideArrivalsInRight 0.5s forwards'
                        : 'slideArrivalsInLeft 0.5s forwards')
                      : undefined
                  }}
                  onAnimationEnd={() => setAnimating(false)}
                >
                  {arrivalsToShow.map((book, idx) => (
                    <div
                      key={'in-' + (book._id || idx)}
                      className="bg-white/70 rounded-xl shadow border border-gray-800 flex flex-col items-center p-3 sm:p-4 opacity-100 min-w-[140px] max-w-[180px] flex-1"
                    >
                      {book.image && (
                        <img
                          src={book.image}
                          alt={book.title}
                          className="h-28 w-20 sm:h-32 sm:w-24 object-cover rounded mb-2 shadow opacity-100"
                        />
                      )}
                      <div className="w-full flex-1 flex flex-col items-center text-center">
                        <div className="text-sm sm:text-base font-bold text-black mb-1 line-clamp-2">
                          {book.title}
                        </div>
                        <div className="text-xs text-gray-700 mb-1">{book.author}</div>
                        <div className="text-black font-semibold text-xs sm:text-sm mb-1">
                          ₱{Number(book.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Right arrow */}
          <button
            className="absolute right-0 z-10 bg-white/80 hover:bg-white text-black rounded-full shadow p-2 transition disabled:opacity-30"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            onClick={handleArrivalsNext}
            disabled={arrivalsTotalPages <= 1 || animating}
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
                onClick={() => {
                  if (!animating) setArrivalsPage(idx);
                }}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      {/* Other Businesses Section */}
      <div className="w-full bg-gray-50 py-10 border-t border-gray-200 mt-8 flex flex-col items-center flex-shrink-0 animate-fade-in">
        <div className="text-2xl font-bold mb-8 text-gray-700">Other Businesses</div>
        <div className="w-full flex flex-wrap justify-center gap-12 px-4 max-w-7xl">
          {businesses.map((biz) => (
            <a
              key={biz.url}
              href={biz.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group"
            >
              <img
                src={biz.img}
                alt={biz.name}
                className={`w-32 h-32 object-contain mb-3 rounded-full shadow group-hover:scale-110 transition ${biz.imgClass || ''}`}
              />
              <span className="text-xl font-semibold text-gray-700">{biz.name}</span>
              {businessStatus[biz.url] === 'up' && (
                <span className="mt-1 text-green-700 text-xs font-semibold bg-green-100 px-2 py-0.5 rounded-full">Online</span>
              )}
              {businessStatus[biz.url] === 'down' && (
                <span className="mt-1 text-red-700 text-xs font-semibold bg-red-100 px-2 py-0.5 rounded-full">Offline</span>
              )}
              {!businessStatus[biz.url] && (
                <span className="mt-1 text-gray-500 text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-full">Checking...</span>
              )}
            </a>
          ))}
        </div>
      </div>
      {/* Fade-in and sliding animation keyframes */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        /* Features Bar Animations */
        .feature-animate {
          animation: featureFadeUp 0.8s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes featureFadeUp {
          from { opacity: 0; transform: translateY(32px) scale(0.96);}
          to { opacity: 1; transform: translateY(0) scale(1);}
        }
        .feature-icon-animate {
          animation: featureIconPop 1.2s cubic-bezier(.4,0,.2,1) infinite alternate;
        }
        @keyframes featureIconPop {
          0% { transform: scale(1) rotate(-2deg);}
          60% { transform: scale(1.08) rotate(2deg);}
          100% { transform: scale(1) rotate(-2deg);}
        }
        @keyframes slideArrivalsInRight {
          from { transform: translateX(100%); opacity: 0.7; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideArrivalsInLeft {
          from { transform: translateX(-100%); opacity: 0.7; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideArrivalsOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0.7; }
        }
        @keyframes slideArrivalsOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0.7; }
        }
        /* Animation for UNIQUE */
        .animate-unique-hero {
          animation: uniqueColorPop 2.2s infinite cubic-bezier(.4,0,.2,1);
          will-change: color, background, transform, text-shadow;
        }
        @keyframes uniqueColorPop {
          0% {
            background: #fca5a5;
            color: #111;
            transform: scale(1) rotate(-2deg);
            text-shadow: 0 2px 8px #fca5a5, 0 0px 0 #fff;
          }
          20% {
            background: #fcd34d;
            color: #b91c1c;
            transform: scale(1.08) rotate(2deg);
            text-shadow: 0 4px 16px #fcd34d, 0 0px 0 #fff;
          }
          40% {
            background: #a5b4fc;
            color: #be185d;
            transform: scale(1.12) rotate(-3deg);
            text-shadow: 0 2px 12px #a5b4fc, 0 0px 0 #fff;
          }
          60% {
            background: #f9a8d4;
            color: #1e293b;
            transform: scale(1.09) rotate(3deg);
            text-shadow: 0 4px 16px #f9a8d4, 0 0px 0 #fff;
          }
          80% {
            background: #fca5a5;
            color: #111;
            transform: scale(1.04) rotate(-2deg);
            text-shadow: 0 2px 8px #fca5a5, 0 0px 0 #fff;
          }
          100% {
            background: #fca5a5;
            color: #111;
            transform: scale(1) rotate(-2deg);
            text-shadow: 0 2px 8px #fca5a5, 0 0px 0 #fff;
          }
        }
      `}</style>
      {/* ...existing code... */}

      {/* Footer with logo and developer names */}
      <footer className="w-full flex flex-row items-center justify-center py-6 gap-7 bg-white border-t border-gray-200 mt-8">
        <div className="flex flex-col items-center gap-3 mb-2">
          <img
            src="/nbs.svg"
            alt="Logo"
            className="w-25 h-25 object-contain"
            style={{ background: "transparent" }}
          />
        </div>
        <div className="flex flex-col  text-gray-600 text-sm">
          Developed by:
          <span></span>
          <span>Lance Krystian Andres</span>
          <span>Wendell Apolonio</span>
          <span>Felix Leid Jr.</span>
          <span>Rohann Harold Mondiguing</span>
        </div>
      </footer>
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
