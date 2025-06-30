import Navbar from '../components/Navbar';

const Contact = () => {
  return (
    <>
      <Navbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-black">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Get in Touch</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We are here to assist you with any inquiries or concerns. Feel free to reach out to us through the following channels:
              </p>
              <ul className="text-lg text-gray-700 leading-relaxed">
                <li className="mb-4">📞 Phone: +63 123 456 7890</li>
                <li className="mb-4">📧 Email: support@nationalbookstore.com</li>
                <li className="mb-4">📍 Address: 123 National Book Store Street, Manila, Philippines</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">Send Us a Message</h3>
              <form className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Your Email"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Your Message"
                    rows="5"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;