// src/pages/DashboardPage.jsx
import { useState } from 'react';

const images = [
  "https://images.unsplash.com/photo-1512820790803-83ca734da794",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca"
];

const moto = "Empowering Minds, One Book at a Time.";

const DashboardPage = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(false);

  const next = () => {
    setFade(true);
    setTimeout(() => {
      setCurrent((current + 1) % images.length);
      setFade(false);
    }, 300);
  };
  const prev = () => {
    setFade(true);
    setTimeout(() => {
      setCurrent((current - 1 + images.length) % images.length);
      setFade(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-white to-red-200 font-lora -z-10">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-12 px-4">
        {/* Carousel on the left */}
        <div className="relative w-full max-w-2xl h-[28rem] flex items-center justify-center">
          <img
            src={images[current]}
            alt={`carousel-${current}`}
            className={`w-full h-[28rem] object-cover rounded-2xl shadow-2xl transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`}
          />
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-black rounded-full p-3 shadow text-2xl"
            aria-label="Previous"
          >
            &#8592;
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-black rounded-full p-3 shadow text-2xl"
            aria-label="Next"
          >
            &#8594;
          </button>
        </div>
        {/* Motto on the right */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-3xl md:text-4xl font-bold text-red-700 text-center drop-shadow">
            {moto}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
