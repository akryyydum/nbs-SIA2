import { Book, School, People, LibraryBooks, Store, EmojiPeople } from '@mui/icons-material';
import Navbar from '../components/Navbar';

const About = () => {
  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-black">75 Years of Endless Discoveries</h2>
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