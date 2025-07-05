import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.origin.includes('localhost')
    ? 'http://localhost:5000'
    : window.location.origin.replace(':5173', ':5000')}/api`;

const Checkout = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
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
  const [bankVerified, setBankVerified] = useState(false);
  const [bankError, setBankError] = useState('');
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

  const totalPrice = cart.reduce(
    (sum, item) => sum + ((item.book?.price || 0) * (item.quantity || 1)),
    0
  );

  const handleInput = e => {
    setBilling(b => ({ ...b, [e.target.name]: e.target.value }));
  };

  // Real bank verification using API
  const verifyBank = async () => {
    setBankError('');
    setBankVerified(false);
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
      setBankError('Please fill in all bank fields.');
      return false;
    }
    try {
      // Replace with your actual bank verification endpoint and payload
      const response = await axios.post(
        'http://192.168.9.23:4000/api/Philippine-National-Bank/business-integration/customer/verify-account',
        {
          bankName: bankInfo.bankName,
          accountNumber: bankInfo.accountNumber,
          accountName: bankInfo.accountName
        }
      );
      // Assume response.data has { valid: boolean, balance: number }
      if (!response.data || !response.data.valid) {
        setBankError('Bank account not found or invalid.');
        return false;
      }
      setBankInfo(b => ({ ...b, balance: response.data.balance }));
      if (response.data.balance < totalPrice) {
        setBankError('Insufficient balance.');
        return false;
      }
      setBankVerified(true);
      return true;
    } catch (err) {
      setBankError('Bank verification failed: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const handleBankInput = e => {
    setBankInfo(b => ({ ...b, [e.target.name]: e.target.value }));
    setBankVerified(false);
    setBankError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    if (!billing.name || !billing.address || !billing.phone || !billing.email) {
      setError('Please fill in all billing fields.');
      setSubmitting(false);
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty.');
      setSubmitting(false);
      return;
    }
    if (paymentMethod === 'bank') {
      const ok = await verifyBank();
      if (!ok) {
        setSubmitting(false);
        return;
      }
      // Build description from cart items
      const description =
        cart
          .map(
            item =>
              `${item.book?.title || 'Book'} x${item.quantity}`
          )
          .join(', ') || 'Book Purchase';
      try {
        const response = await axios.post(
          'http://192.168.9.23:4000/api/Philippine-National-Bank/business-integration/customer/pay-business',
          {
            customerAcoountNumber: bankInfo.accountNumber,
            toBusinessAccount: '222-3384-522-8972',
            amount: totalPrice,
            description
          }
        );
        // Optionally check response.data for success/failure
        if (!response.data || response.data.status !== 'success') {
          setError('Bank transaction failed.');
          setSubmitting(false);
          return;
        }
      } catch (err) {
        setError('Bank transaction failed: ' + (err.response?.data?.message || err.message));
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
          modeofPayment
          // ...existing code...
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
              />
              <input
                name="address"
                type="text"
                placeholder="Address"
                value={billing.address}
                onChange={handleInput}
                className="border px-3 py-2 rounded"
                required
              />
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
                  <span>
                    ₱{Number(item.book?.price * item.quantity).toFixed(2)}
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
                  <input
                    name="bankName"
                    type="text"
                    placeholder="Bank Name"
                    value={bankInfo.bankName}
                    onChange={handleBankInput}
                    className="border px-3 py-2 rounded"
                    required
                  />
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
                {/* Show balance if verified */}
                {bankVerified && (
                  <div className="text-green-700 text-sm">
                    Bank verified. Balance: ₱{Number(bankInfo.balance).toFixed(2)}
                  </div>
                )}
                {bankError && (
                  <div className="text-red-600 text-sm">{bankError}</div>
                )}
              </div>
            )}
          </div>
          {/* Error/Success */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition"
            disabled={submitting}
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Checkout;
