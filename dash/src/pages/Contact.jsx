import Navbar from '../components/Navbar';


const Contact = () => {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-white flex flex-col justify-center items-center font-poppins animate-fade-in">
        {/* Social icons vertical bar */}
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className="mb-4 text-xs text-gray-400 tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            FOLLOW US
          </div>
          <div className="flex flex-col gap-4 text-gray-400">
            <a href="#" className="hover:text-blue-600"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="hover:text-blue-600"><i className="fab fa-instagram"></i></a>
            <a href="#" className="hover:text-blue-600"><i className="fab fa-dribbble"></i></a>
            <a href="#" className="hover:text-blue-600"><i className="fab fa-twitter"></i></a>
          </div>
        </div>
        {/* Main content */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 bg-white shadow-none">
          {/* Left: Contact Form */}
          <div className="flex flex-col justify-center px-8 py-12">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-black mb-2">Contact us</h2>
              <div className="text-sm text-gray-500 mb-6">Reach out to us for any inquiry</div>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black"
                />
                <textarea
                  placeholder="Message"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-black resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition"
                >
                  SUBMIT
                </button>
              </form>
            </div>
            {/* Info row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="flex flex-col items-center text-center">
                <svg width="36" height="36" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 20.5V17a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3.5" />
                  <path d="M12 3v13" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <div className="mt-2 text-xs text-gray-500">Location:</div>
                <div className="text-sm text-black font-medium">Mariellen Street, No. 14, 2nd floor</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <svg width="36" height="36" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
                <div className="mt-2 text-xs text-gray-500">Email:</div>
                <div className="text-sm text-black font-medium break-all">bubutdragos@everone.com</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <svg width="36" height="36" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.99.35 2.01.59 3.06.72A2 2 0 0 1 22 16.92z" />
                </svg>
                <div className="mt-2 text-xs text-gray-500">Phone:</div>
                <div className="text-sm text-black font-medium">+40 755 222 456</div>
              </div>
            </div>
          </div>
          {/* Right: Map with red accent */}
          <div className="flex flex-col justify-center items-center relative px-8 py-12">
            <div className="relative w-full max-w-lg mx-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-tr-lg z-10" style={{ transform: 'translate(40px, -40px)' }} />
              <div className="overflow-hidden rounded-lg shadow-lg border border-gray-100 relative z-20">
                <iframe
                  title="map"
                  width="100%"
                  height="400"
                  frameBorder="0"
                  style={{ border: 0, minWidth: 320 }}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4134.013269745127!2d121.17673887547505!3d16.51562088423055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33904149b5d44bc7%3A0x3fac9b9092f2500!2sNational%20Book%20Store%20-%20Solano!5e1!3m2!1sen!2sph!4v1751471702234!5m2!1sen!2sph"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        {/* FontAwesome CDN for icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      </div>
      {/* Fade-in animation style */}
      <style>{`
        .animate-fade-in {
          animation: fadeInContact 0.8s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeInContact {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </>
  );
};

export default Contact;