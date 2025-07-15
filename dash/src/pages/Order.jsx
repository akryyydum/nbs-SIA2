import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaShoppingCart } from 'react-icons/fa';

const API_BASE = '/api'; // Use relative path for any IP

const Order = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);
  const [bankSystem, setBankSystem] = useState('default'); // 'default' or 'other'
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    balance: ''
  });
  const [bankVerified, setBankVerified] = useState(false);
  const [bankError, setBankError] = useState('');
  const [receiving, setReceiving] = useState(null);
  const [modeofPayment, setModeofPayment] = useState('Cash'); // Add this line for payment mode
  const [newOrder, setNewOrder] = useState({ items: [{ book: "", quantity: 1 }] }); // or match your structure
  const [receiptOrder, setReceiptOrder] = useState(null); // Add this line
  const receiptRef = useRef(); // For printing

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/orders/my`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setOrders(res.data || []);
      } catch {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(orderId);
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setOrders(orders =>
        orders.map(o =>
          o._id === orderId ? { ...o, status: 'declined' } : o
        )
      );
    } catch (err) {
      alert('Failed to cancel order');
    }
    setCancelling(null);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'accepted') return order.status === 'accepted';
    if (filter === 'declined') return order.status === 'declined';
    if (filter === 'shipped') return order.status === 'out for delivery';
    if (filter === 'received') return order.status === 'received'; // add this line
    return true;
  });

  // Replace the simulated verifyBank with a real API call
  const verifyBank = async () => {
    setBankError('');
    setBankVerified(false);
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
      setBankError('Please fill in all bank fields.');
      return false;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/bank/verify`,
        {
          bankSystem,
          bankName: bankInfo.bankName,
          accountNumber: bankInfo.accountNumber,
          accountName: bankInfo.accountName
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (res.data && res.data.verified) {
        setBankInfo(b => ({ ...b, balance: res.data.balance }));
        setBankVerified(true);
        return true;
      } else {
        setBankError(res.data?.message || 'Bank verification failed.');
        return false;
      }
    } catch (err) {
      setBankError(err.response?.data?.message || 'Bank verification failed.');
      return false;
    }
  };

  const handleReceived = async (orderId) => {
    if (!window.confirm('Confirm you have received this order?')) return;
    setReceiving(orderId);
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/received`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setOrders(orders =>
        orders.map(o =>
          o._id === orderId ? { ...o, status: 'received' } : o
        )
      );
      // Find the order and set for receipt
      const order = orders.find(o => o._id === orderId);
      if (order) setReceiptOrder({ ...order, status: 'received' });
      // Notify Products page to refresh books and update stocks
      window.dispatchEvent(new Event('books-updated'));
    } catch (err) {
      alert('Failed to mark as received');
    }
    setReceiving(null);
  };

  // Print handler
  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const win = window.open('', '', 'width=700,height=900');
    win.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .receipt-title { font-size: 1.5em; font-weight: bold; margin-bottom: 16px; }
            .receipt-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .receipt-table th, .receipt-table td { border: 1px solid #ccc; padding: 8px; }
            .receipt-table th { background: #f5f5f5; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // Example order creation handler (ensure modeofPayment is included)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE}/orders`,
        {
          items: newOrder.items, // or whatever your items state is called
          modeofPayment,         // <-- make sure this is included
          // ...other fields if needed
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      // ...success logic...
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place order");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafd] to-[#e9e6f7] py-10 px-2 font-poppins">
      {/* Tabs */}
      <div className="flex gap-2 mb-10 max-w-5xl mx-auto">
        { [
          { key: 'pending', label: 'New Orders' },
          { key: 'accepted', label: 'Assigned' },
          { key: 'shipped', label: 'On Going' },
          { key: 'received', label: 'Completed' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm text-base
              ${filter === tab.key
                ? 'bg-white text-red-700 shadow-md border border-red-300 animate-tab-pop'
                : 'bg-[#f3f4fa] text-gray-500 hover:bg-white hover:text-black'
            }`}
            onClick={() => setFilter(tab.key)}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${
              filter === tab.key ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {orders.filter(order => {
                if (tab.key === 'pending') return order.status === 'pending';
                if (tab.key === 'accepted') return order.status === 'accepted';
                if (tab.key === 'shipped') return order.status === 'out for delivery';
                if (tab.key === 'received') return order.status === 'received';
                return false;
              }).length}
            </span>
          </button>
        ))}
      </div>
      {/* Orders Grid */}
      <div key={filter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto animate-fade-in-order">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-8">No orders found.</div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order._id}
              className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col gap-3 transition hover:shadow-2xl"
              style={{
                minHeight: 210,
                boxShadow: '0 4px 24px 0 rgba(31,38,135,0.08)'
              }}
            >
              {/* Order Header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-xs text-gray-400 font-semibold">Order No.</div>
                  <div className="font-bold text-lg text-black tracking-wide">#{order._id?.slice(-10)}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : order.status === 'accepted' ? 'bg-blue-100 text-blue-700'
                        : order.status === 'out for delivery' ? 'bg-blue-100 text-blue-700'
                        : order.status === 'received' ? 'bg-green-100 text-green-700'
                        : order.status === 'declined' ? 'bg-gray-200 text-gray-500'
                        : 'bg-gray-100 text-gray-700'}`}>
                      {order.status === 'out for delivery'
                        ? 'On Going'
                        : order.status === 'received'
                          ? 'Completed'
                          : order.status === 'pending'
                            ? 'New'
                            : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {/* Cart icon with item count */}
                    <span className="relative">
                      <FaShoppingCart className="text-black-500 text-xl drop-shadow" />
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 font-bold shadow">{order.items?.length || 0}</span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Order Details */}
              <div className="text-sm text-gray-700 mb-1">
                <span className="font-semibold">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              {/* Ordered Books List */}
              <ul className="mb-2 ml-2">
                {order.items && order.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                    {item.book?.title || 'Book'} x {item.quantity}
                  </li>
                ))}
              </ul>
              {/* Order Actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                  onClick={() => setModalOrder(order)}
                >
                  View
                </button>
                {order.status === 'pending' && (
                  <button
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold"
                    onClick={() => handleCancel(order._id)}
                    disabled={cancelling === order._id}
                  >
                    {cancelling === order._id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
                {order.status === 'out for delivery' && (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                    onClick={() => handleReceived(order._id)}
                    disabled={receiving === order._id}
                  >
                    {receiving === order._id ? 'Processing...' : 'Order Received'}
                  </button>
                )}
                {order.status === 'received' && (
                  <button
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold"
                    onClick={() => setReceiptOrder(order)}
                  >
                    Print Receipt
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal for order details */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl font-bold"
              onClick={() => setModalOrder(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-black">
              Order Details
            </h3>
            <div className="space-y-2">
              <div><span className="font-semibold">Order ID:</span> {modalOrder._id}</div>
              <div><span className="font-semibold">Status:</span> {modalOrder.status}</div>
              <div><span className="font-semibold">Total Price:</span> ₱{Number(modalOrder.totalPrice).toFixed(2)}</div>
              <div>
                <span className="font-semibold">Items:</span>
                <ul className="list-disc ml-6">
                  {modalOrder.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 mb-1">
                      {item.book?.image && (
                        <img
                          src={item.book.image}
                          alt={item.book?.title || 'Book'}
                          className="h-10 w-8 object-cover rounded shadow"
                        />
                      )}
                      <span>
                        {item.book?.title || 'Book'} x {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold">Placed:</span> {new Date(modalOrder.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl font-bold"
              onClick={() => setReceiptOrder(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div ref={receiptRef}>
              <div className="receipt-title text-center mb-4">Order Receipt</div>
              <div><b>Order ID:</b> {receiptOrder._id}</div>
              <div><b>Date:</b> {new Date(receiptOrder.createdAt).toLocaleString()}</div>
              <div><b>Status:</b> {receiptOrder.status}</div>
              <div><b>Payment:</b> {receiptOrder.modeofPayment}</div>
              <table className="receipt-table mt-4">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.book?.title || 'Book'}</td>
                      <td>{item.quantity}</td>
                      <td>
                        ₱{item.book?.price
                          ? (item.book.price * item.quantity).toFixed(2)
                          : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="total text-right">Total</td>
                    <td className="total">₱{Number(receiptOrder.totalPrice).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              className="mt-6 w-full bg-black text-white py-2 rounded hover:bg-gray-800"
              onClick={handlePrint}
            >
              Print Receipt
            </button>
          </div>
        </div>
      )}
      <style>{`
        .animate-fade-in-order {
          animation: fadeInOrder 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeInOrder {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-tab-pop {
          animation: tabPop 0.25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes tabPop {
          0% { background: #fff; color: #000; transform: scale(1);}
          50% { background: #f87171; color: #fff; transform: scale(1.08);}
          100% { background: #fff; color: #b91c1c; transform: scale(1);}
        }
      `}</style>
    </div>
  );
};

export default Order;
