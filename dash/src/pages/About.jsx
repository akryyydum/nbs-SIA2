import Navbar from '../components/Navbar';

const stats = [
  { value: '100+', label: 'employees' },
  { value: '15+', label: 'Countries' },
  { value: '60+', label: 'Projects done' },
  { value: '30+', label: 'Offices' },
  { value: '25+', label: 'Project Awards' },
];

const About = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white font-poppins">
        {/* Section: Title and Subtitle */}
        <div className="max-w-4xl mx-auto pt-12 pb-8 text-center">
          <div className="text-red-700 font-semibold text-sm mb-2">About Us</div>
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3 leading-tight">
            Bringing Your Vision to Life<br />with Expertise and Dedication
          </h1>
        </div>
        {/* Section: Image */}
        <div className="flex justify-center">
          <img
            src="https://images.pexels.com/photos/15426307/pexels-photo-15426307.jpeg"
            alt="Team"
            className="rounded-3xl shadow-xl object-cover w-full max-w-3xl h-72 md:h-96 mb-8"
            style={{ objectPosition: 'center' }}
          />
        </div>
        {/* Section: Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 bg-[#f8f5f2] rounded-2xl max-w-4xl mx-auto px-6 py-8 mb-12 shadow">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[110px]">
              <div className="text-3xl md:text-4xl font-bold text-black mb-1">{stat.value}</div>
              <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
        {/* Section: Story */}
        <div className="max-w-3xl mx-auto text-center mb-2">
          <div className="text-green-700 font-semibold mb-2">Crafting Excellence</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">The VisionCrafters Journey Story</h2>
        </div>
        <div className="max-w-3xl mx-auto text-gray-700 text-base md:text-lg leading-relaxed px-2 text-center">
          <p className="mb-4">
           National Book Store, the Philippines’ beloved retail giant, began as a humble stall along Escolta Street in Manila in the 1940s. Founded by Socorro “Nanay Coring” Ramos and her husband José, the store originally sold books, supplies, and soap during the Japanese occupation. When a typhoon destroyed their store, the couple didn’t give up—instead, they rebuilt from scratch. Over time, their perseverance paid off, and the small store grew into a trusted brand that would become a part of nearly every Filipino student’s life.
          </p>
          <p className="mb-4">
         Today, National Book Store stands as a cultural icon, with hundreds of branches nationwide. More than just a supplier of books and school supplies, it has become a symbol of education, dreams, and resilience. From bestselling novels to art materials, it has nurtured generations of learners and readers. Its story reflects the heart of the Filipino spirit—one that values hard work, learning, and never giving up even in the face of hardship.
          </p>
        </div>
      </div>
    </>
  );
};

export default About;