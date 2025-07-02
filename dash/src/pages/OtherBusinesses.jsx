import React from 'react';

const businesses = [
  { name: 'Blended', url: 'http://192.168.9.7:5173' },
  { name: 'National Bookstore', url: 'http://192.168.9.16:5173' },
  { name: 'Tara laba', url: 'http://192.168.9.27:5173' },
  { name: 'Dental Clinic', url: 'http://192.168.9.35:5173' },
  { name: 'Jollibee', url: 'http://192.168.9.37:5173' },
  { name: 'PNB', url: 'http://192.168.9.23:5173' },
  { name: 'ITBYTES', url: 'http://192.168.9.4:5173' },
];

const OtherBusinesses = () => (
  <div className="max-w-xl mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6 text-center">Other Businesses</h1>
    <ul className="space-y-4">
      {businesses.map((biz, idx) => (
        <li key={idx} className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3 hover:bg-red-50 transition">
          <span className="font-semibold text-gray-800">{biz.name}</span>
          <a
            href={biz.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-700 hover:underline text-sm"
          >
            {biz.url}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default OtherBusinesses;
