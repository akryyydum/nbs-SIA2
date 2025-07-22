import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE =
  'https://nbs-sia2.onrender.com'||
  `${window.location.origin.includes('localhost')
    ? 'http://localhost:5000'
    : window.location.origin.replace(':5173', ':5000')}/api`;
const provinces = [
  {
    name: 'Nueva Vizcaya',
    municipalities: [
      {
        name: 'Alfonso Castañeda',
        zip: '3711',
        barangays: ['Abuyo','Cauayan','Galintuja','Lipuga','Lublub','Pelaway']
      },
      {
        name: 'Ambaguio',
        zip: '3701',
        barangays: ['Ammueg','Camandag','Dulli','Labang','Napo','Poblacion','Salingsingan','Tiblac']
      },
      {
        name: 'Aritao',
        zip: '3704',
        barangays: [
          'Anayo','Baan','Balite','Banganan','Beti','Bone North','Bone South',
          'Calitlitan','Canabuan','Canarem','Comon','Cutar','Darapidap','Kirang',
          'Latar-Nocnoc-San Francisco','Nagcuartelan','Ocao-Capiniaan','Poblacion',
          'Santa Clara','Tabueng','Tucanon','Yaway'
        ]
      },
      {
        name: 'Bagabag',
        zip: '3711',
        barangays: [
          'Bakir','Baretbet','Careb','Lantap','Murong','Nangalisan','Paniki',
          'Pogonsino','Quirino','San Geronimo','San Pedro','Santa Cruz','Santa Lucia',
          'Tuao North','Tuao South','Villa Coloma','Villaros'
        ]
      },
      {
        name: 'Bambang',
        zip: '3702',
        barangays: [
          'Abian','Abinganan','Aliaga','Almaguer North','Almaguer South','Banggot',
          'Barat','Buag','Calaocan','Dullao','Homestead','Indiana','Mabuslo',
          'Macate','Magsaysay Hills','Manamtam','Mauan','Pallas','Salinas',
          'San Antonio North','San Antonio South','San Fernando','San Leonardo',
          'Santo Domingo','Santo Domingo West'
        ]
      },
      {
        name: 'Bayombong',
        zip: '3700',
        barangays: [
          'Bansing','Bonfal East','Bonfal Proper','Bonfal West','Buenavista','Busilac',
          'Cabuaan','Casat','District III Poblacion','District IV','Don Domingo Maddela Poblacion',
          'Don Mariano Marcos','Don Tomas Maddela Poblacion','Ipil-Cuneg',
          'La Torre North','La Torre South','Luyang','Magapuy','Magsaysay',
          'Masoc','Paitan','Salvacion','San Nicolas North','Santa Rosa','Vista Alegre'
        ]
      },
      {
        name: 'Diadi',
        zip: '3705',
        barangays: [
          'Ampakling','Arwas','Balete','Bugnay','Butao','Decabacan','Duruarog','Escoting',
          'Langca','Lurad','Nagsabaran','Namamparan','Pinya','Poblacion','Rosario',
          'San Luis','San Pablo','Villa Aurora','Villa Florentino'
        ]
      },
      {
        name: 'Dupax del Norte',
        zip: '3706',
        barangays: [
          'Belance','Binnuangan','Bitnong','Bulala','Inaban','Ineangan','Lamo','Mabasa',
          'Macabenga','Malasin','Munguia','New Gumiad','Oyao','Parai','Yabbi'
        ]
      },
      {
        name: 'Dupax del Sur',
        zip: '3707',
        barangays: [
          'Abaca','Bagumbayan','Balsain','Banila','Biruk','Canabay','Carolotan','Domang',
          'Dopaj','Gabut','Ganao','Kimbutan','Kinabuan','Lukidnon','Mangayang',
          'Palabotan','Sanguit','Santa Maria','Talbek'
        ]
      },
      {
        name: 'Kasibu',
        zip: '3703',
        barangays: [
          'Alimit','Alloy','Antutot','Bilet','Binogawan','Biyoy','Bua','Camamasi',
          'Capisaan','Catarawan','Cordon','Didipio','Dine','Kakiduguen','Kongkong',
          'Lupa','Macalong','Malabing','Muta','Nantawacan','Pacquet','Pao',
          'Papaya','Poblacion','Pudi','Seguem','Tadji','Tokod','Wangal','Watwat'
        ]
      },
      {
        name: 'Kayapa',
        zip: '3712',
        barangays: [
  'Acacia',
  'Alang-Salacsac',
  'Amelong Labeng',
  'Ansipsip',
  'Baan',
  'Babadi',
  'Balangabang',
  'Balete',
  'Banao',
  'Binalian',
  'Besong',
  'Buyasyas',
  'Cabalatan Alang',
  'Cabanglasan',
  'Cabayo',
  'Castillo Village',
  'Kayapa Proper East',
  'Kayapa Proper West',
  'Latbang',
  'Lawigan',
  'Mapayao',
  'Nansiakan',
  'Pampang (Poblacion)',
  'Pangawan',
  'Pinayag',
  'Pingkian',
  'San Fabian',
  'Talicabcab',
  'Tidang Village',
  'Tubongan'
]

      },
      {
        name: 'Quezon',
        zip: '3710',
        barangays: ['Aurora','Baresbes','Baliwao','Bonifacio','Calaocan','Caliat','Dagupan','Darubba','Maddiiangat','Nalubbunan','Runruno','Maasin']
      },
      {
        name: 'Santa Fe',
        zip: '3708',
        barangays: [
  'Atbu',
  'Bacneng',
  'Balete',
  'Baliling',
  'Bantinan',
  'Baracbac',
  'Buyasyas',
  'Canabuan',
  'Imugan',
  'Malico',
  'Poblacion',
  'Santa Rosa',
  'Sinapaoan',
  'Tactac',
  'Unib',
  'Villa Flores'
]

      },
      {
        name: 'Solano',
        zip: '3709',
        barangays: [
          'Aggub','Bagahabag','Bangaan','Bangar','Bascaran','Communal','Concepcion',
          'Curifang','Dadap','Lactawan','Osmeña','Pilar D. Galima','Poblacion North',
          'Poblacion South','Quezon','Quirino','Roxas','San Juan','San Luis','Tucal','Uddiawan','Wacal'
        ]
      },
      {
        name: 'Villaverde',
        zip: '3713',
        barangays: [
          'Bintawan Norte','Bintawan Sur','Cabuluan','Ibung','Nagbitin','Ocapon',
          'Pieza','Poblacion (Turod)','Sawmill'
        ]
      }
    ]
  }
];


const Checkout = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    location: null // { lat, lng, address }
  });
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    balance: ''
  });
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const navigate = useNavigate();

  // Fetch cart and prefill billing info
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/cart`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setCart(res.data.items || []);
        setBilling(b => ({
          ...b,
          name: user?.name || '',
          email: user?.email || ''
        }));
      } catch {
        setCart([]);
      }
      setLoading(false);
    };
    fetchCart();
  }, [user]);

  useEffect(() => {
    // Reset municipality/barangay when province changes
    setSelectedMunicipality('');
    setSelectedBarangay('');
    setZipCode('');
  }, [selectedProvince]);

  useEffect(() => {
    // Reset barangay when municipality changes
    setSelectedBarangay('');
    // Auto-set zip code when municipality changes
    if (selectedProvince && selectedMunicipality) {
      const muni = provinces
        .find(p => p.name === selectedProvince)
        ?.municipalities.find(m => m.name === selectedMunicipality);
      setZipCode(muni?.zip || '');
    } else {
      setZipCode('');
    }
  }, [selectedMunicipality, selectedProvince]);

  const totalPrice = cart.reduce(
    (sum, item) => sum + ((item.book?.price || 0) * (item.quantity || 1)),
    0
  );

  const handleInput = e => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow digits
      const digits = value.replace(/\D/g, '');
      setBilling(b => ({ ...b, [name]: digits }));
    } else {
      setBilling(b => ({ ...b, [name]: value }));
    }
  };

  const handleBankInput = e => {
    setBankInfo(b => ({ ...b, [e.target.name]: e.target.value }));
  };

  const handleLocationChange = () => {
    // Compose address string
    const address = [
      street,
      selectedBarangay,
      selectedMunicipality,
      selectedProvince,
      zipCode
    ].filter(Boolean).join(', ');
    setBilling(b => ({
      ...b,
      location: address,
      address
    }));
  };

  const outOfStockItems = cart.filter(item => item.book?.stock === 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    // Prevent checkout if any item has stock 0
    if (outOfStockItems.length > 0) {
      alert(`Cannot checkout: "${outOfStockItems[0].book?.title || 'Book'}" is out of stock.`);
      setError('Cannot checkout: One or more items are out of stock.');
      setSubmitting(false);
      return;
    }
    if (!billing.name || !billing.phone || !billing.email || !billing.location) {
      setError('Please fill in all billing fields and select a shipping location.');
      setSubmitting(false);
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty.');
      setSubmitting(false);
      return;
    }
    if (paymentMethod === 'bank') {
      // Build details from cart items
      const details =
        cart
          .map(
            item =>
              `${item.book?.title || 'Book'} x${item.quantity}`
          )
          .join(', ') || 'Book Purchase';
      // Debug: log payload to check for issues
      const bankPayload = {
        customerAccountNumber: bankInfo.accountNumber,
        toBusinessAccount: '222-3384-522-8972',
        amount: totalPrice,
        details
      };
      console.log('Bank API payload:', bankPayload); 
      try {
        const response = await axios.post(
          'http://192.168.9.23:4000/api/Philippine-National-Bank/business-integration/customer/pay-business',
          bankPayload
        );
        // Debug: log full response data
        console.log('Bank API response:', response.data);
        // Accept any truthy response.data as success, otherwise show actual status
        if (!response.data) {
          setError('Bank transaction failed: No response data.');
          setSubmitting(false);
          return;
        } else if (response.data.status && response.data.status !== 'success') {
          setError('Bank transaction status: ' + response.data.status);
          setSubmitting(false);
          return;
        } else {
          setSuccess('Bank payment sent successfully.');
        }
      } catch (err) {
        setError('Bank transaction failed: ' + (err.response?.data?.message || err.message));
        console.error('Bank transaction error:', err);
        setSubmitting(false);
        return;
      }
    }
    try {
      // Prepare items for order
      const items = cart.map(item => ({
        book: item.book._id,
        quantity: item.quantity
      }));
      // Map paymentMethod to modeofPayment for backend compatibility
      let modeofPayment = '';
      if (paymentMethod === 'bank') {
        modeofPayment = 'Bank Transfer';
      } else if (paymentMethod === 'cod') {
        modeofPayment = 'Cash on Delivery';
      } else {
        modeofPayment = paymentMethod;
      }

      // Create order
      await axios.post(
        `${API_BASE}/orders`,
        {
          items,
          modeofPayment,
          shippingLocation: billing.location // send location to backend
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // Optionally: handle payment intent if paymentMethod === 'bank'
      // Clear cart
      await axios.delete(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSuccess('Order placed successfully!');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    }
    setSubmitting(false);
  };

  const bankNames = [
    'Philippine National Bank'
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Checkout</h2>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading cart...</div>
      ) : cart.length === 0 ? (
        <div className="text-center text-gray-400 py-8">Your cart is empty.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Info */}
          <div>
            <h3 className="font-semibold mb-2 text-red-700">Billing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                value={billing.name}
                onChange={handleInput}
                className="border px-3 py-2 rounded"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={billing.email}
                onChange={handleInput}
                className="border px-3 py-2 rounded"
                required
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone"
                value={billing.phone}
                onChange={handleInput}
                className="border px-3 py-2 rounded"
                required
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {/* Location dropdowns */} 
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                
              <h3 className="font-semibold mb-2 text-red-700">Shipping Information</h3> <br/>
                <select
                  value={selectedProvince}
                  onChange={e => { setSelectedProvince(e.target.value); handleLocationChange();  }}
                  className="border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={selectedMunicipality}
                  onChange={e => { setSelectedMunicipality(e.target.value); handleLocationChange(); }}
                  className="border px-3 py-2 rounded"
                  required
                  disabled={!selectedProvince}
                >
                  <option value="">Select Municipality</option>
                  {selectedProvince &&
                    provinces.find(p => p.name === selectedProvince)?.municipalities.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                </select>
                <select
                  value={selectedBarangay}
                  onChange={e => { setSelectedBarangay(e.target.value); handleLocationChange(); }}
                  className="border px-3 py-2 rounded"
                  required
                  disabled={!selectedMunicipality}
                >
                  <option value="">Select Barangay</option>
                  {selectedMunicipality &&
                    provinces
                      .find(p => p.name === selectedProvince)
                      ?.municipalities.find(m => m.name === selectedMunicipality)
                      ?.barangays
                      .filter(b => b !== '—') // Only show valid barangays, skip placeholders
                      .map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                </select>
                <input
                  name="zipCode"
                  type="text"
                  placeholder="Zip Code"
                  value={zipCode}
                  onChange={e => { setZipCode(e.target.value); handleLocationChange(); }}
                  className="border px-3 py-2 rounded"
                  required
                  readOnly
                />
                <input
                  name="street"
                  type="text"
                  placeholder="Street"
                  value={street}
                  onChange={e => { setStreet(e.target.value); handleLocationChange(); }}
                  className="border px-3 py-2 rounded"
                  required
                />
              </div>
            </div>
          </div>
          {/* Cart Summary
          
          */}
          <div>
            <h3 className="font-semibold mb-2 text-red-700">Order Summary</h3>
            <ul className="divide-y">
              {cart.map((item, idx) => (
                <li key={item._id || idx} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.book?.title || 'Book'} x {item.quantity}
                  </span>
                  <span
                    className={
                      item.book?.stock === 0
                        ? 'text-red-600 font-bold'
                        : item.book?.stock <= 3
                          ? 'text-yellow-600 font-bold'
                          : ''
                    }
                  >
                    ₱{Number(item.book?.price * item.quantity).toFixed(2)}
                    {item.book?.stock === 0 && ' (Out of Stock)'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold mt-2">
              <span>Total:</span>
              <span>₱{Number(totalPrice).toFixed(2)}</span>
            </div>
          </div>
          {/* Payment Method */}
          <div>
            <h3 className="font-semibold mb-2 text-red-700">Payment Method</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={() => setPaymentMethod('bank')}
                />
                <span>Connect to Bank (Online Payment)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span>Cash on Delivery</span>
              </label>
            </div>
            {/* Bank Info Fields */}
            {paymentMethod === 'bank' && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    name="bankName"
                    value={bankInfo.bankName}
                    onChange={handleBankInput}
                    className="border px-3 py-2 rounded"
                    required
                  >
                    <option value="">Select Bank Name</option>
                    {bankNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    name="accountName"
                    type="text"
                    placeholder="Account Name"
                    value={bankInfo.accountName}
                    onChange={handleBankInput}
                    className="border px-3 py-2 rounded"
                    required
                  />
                  <input
                    name="accountNumber"
                    type="text"
                    placeholder="Account Number"
                    value={bankInfo.accountNumber}
                    onChange={handleBankInput}
                    className="border px-3 py-2 rounded"
                    required
                  />
                </div>
              </div>
            )}
          </div>
          {/* Error/Success */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          {/* Out of Stock Message */}
          {outOfStockItems.length > 0 && (
            <div className="text-red-600 text-sm font-bold mb-2">
              {`"${outOfStockItems[0].book?.title || 'Book'}" is out of stock. Please remove it from your cart to proceed.`}
            </div>
          )}
          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition"
            disabled={submitting || outOfStockItems.length > 0}
            style={outOfStockItems.length > 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Checkout;
