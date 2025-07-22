import React, { useEffect, useState } from 'react';

const businesses = [
  {
    name: 'Blended',
    url: 'http://192.168.9.7:5173',
    img: '/blended.jpg'
  },
  {
    name: 'National Bookstore',
    url: 'https://nbs-sia.vercel.app',
    img: '/nbs.svg'
  },
  {
    name: 'Tara laba',
    url: 'https://tara-laba.vercel.app/',
    img: '/tl.jpg'
  },
  {
    name: 'Dental Clinic',
    url: 'https://molar-record.vercel.app',
    img: '/dentist.png'
  },
  {
    name: 'Jollibee',
    url: 'http://192.168.9.37:5173',
    img: 'https://1000logos.net/wp-content/uploads/2021/05/Jollibee-logo.png',
    imgClass: 'bg-white'
  },
  {
    name: 'PNB',
    url: 'https://pnb-client.vercel.app',
    img: 'https://www.pds.com.ph/wp-content/uploads/2018/12/PNB-Logo-Short-YouFirst-011117-FC-HQ-1024x676.png',
    imgClass: 'bg-white'
  },
  {
    name: 'ITBYTES',
    url: 'https://it-bytes-ui.vercel.app',
    img: '/it.jpg'
  }
];

const OtherBusinesses = () => {
  const [businessStatus, setBusinessStatus] = useState({});

  useEffect(() => {
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
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Other Businesses</h1>
        <div className="w-full flex flex-wrap justify-center gap-12 px-4">
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
    </div>
  );
};

export default OtherBusinesses;
