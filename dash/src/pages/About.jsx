import { Book, School, People, LibraryBooks, Store, EmojiPeople } from '@mui/icons-material';
import Navbar from '../components/Navbar';

const About = () => {
  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 animate-fade-in">
        {/* Background image behind h2 only */}
        <div className="relative max-w-7xl mx-auto">
          <div className="relative w-full h-64 mb-12">
            <div
              className="absolute inset-0 w-full h-full rounded-2xl shadow-lg bg-cover bg-center"
              style={{
                backgroundImage: "url('https://images.pexels.com/photos/15426307/pexels-photo-15426307.jpeg')"
              }}
            ></div>
            <div className="absolute inset-0 w-full h-full flex justify-center items-center z-10 pointer-events-none">
              <h2
                className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-white to-red-600 animate-gradient-x drop-shadow-lg"
                style={{
                  backgroundSize: '200% 200%',
                  animation: 'gradient-x 3s ease-in-out infinite'
                }}
              >
                75 Years of Endless Discoveries
              </h2>
            </div>
          </div>
          {/* Gradient animation keyframes */}
          <style>
            {`
              @keyframes gradient-x {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 3s ease-in-out infinite;
              }
              .animate-fade-in {
                animation: fadeInAbout 0.8s cubic-bezier(.4,0,.2,1);
              }
              @keyframes fadeInAbout {
                from { opacity: 0; transform: translateY(40px);}
                to { opacity: 1; transform: translateY(0);}
              }
            `}
          </style>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-12 mb-16">
            <div className="flex flex-col items-center">
              <Book className="h-32 w-32 mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-black mb-2">NUMBER OF TITLES</h3>
              <p className="text-2xl text-gray-700 font-bold">90,000 ++</p>
            </div>
            <div className="flex flex-col items-center">
              <School className="h-32 w-32 mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-black mb-2">SCHOOL AND OFFICE SUPPLIES</h3>
              <p className="text-2xl text-gray-700 font-bold">100,000 ++</p>
            </div>
            <div className="flex flex-col items-center">
              <People className="h-32 w-32 mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-black mb-2">STUDENTS HELPED</h3>
              <p className="text-2xl text-gray-700 font-bold">500,000 ++</p>
            </div>
            <div className="flex flex-col items-center">
              <LibraryBooks className="h-32 w-32 mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-black mb-2">LIBRARIES BUILT</h3>
              <p className="text-2xl text-gray-700 font-bold">2,000 ++</p>
            </div>
            <div className="flex flex-col items-center">
              <Store className="h-32 w-32 mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-black mb-2">STORES NATIONWIDE</h3>
              <p className="text-2xl text-gray-700 font-bold">200 ++</p>
            </div>
            <div className="flex flex-col items-center">
              <EmojiPeople className="h-32 w-32 mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-black mb-2">HAPPY EMPLOYEES</h3>
              <p className="text-2xl text-gray-700 font-bold">3,000 ++</p>
            </div>
          </div>
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              For many years, we have remained close to the hearts of millions of Filipinos across generations. No matter what point they are in their lives, they will always have a home here in National Book Store – whether they are readers, artists, students, even the whole family.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              We are proud to remain a constant in everyone's journey, nurturing the passions and inspiring the growth of every Filipino. Our founders, Socorro Cancio – Ramos, Jose Ramos, and their family, embodied hard work and powerful leadership and persevered against all odds. Their once small stall in Escolta, despite having been burnt to the ground during the Japanese occupation and later ravaged by a typhoon, would persevere and prosper amidst such great adversity. It is this resilience and relentlessness that took us to heights they once thought were impossible.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Their journey is an inspiration for Filipinos everywhere, and a reminder of the humble beginnings of one of the country's most loved institutions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;