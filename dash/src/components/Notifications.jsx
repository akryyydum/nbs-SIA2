import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";

const API_BASE = 'https://nbs-sia2.onrender.com/api';

export default function Notifications({ user, iconClassName = "h-7 w-7", bellStyle = {} }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]); // Track notifications being deleted

  useEffect(() => {
    if (!user?.token) {
      setNotifications([]);
      return;
    }
    axios
      .get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      .then(res => setNotifications(res.data || []))
      .catch(() => setNotifications([]));
  }, [user]);

  // Delete all notifications with animation
  const handleClearNotifications = async () => {
    setDeletingIds(notifications.map(n => n._id));
    setTimeout(async () => {
      try {
        await axios.delete(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setNotifications([]);
        setDeletingIds([]);
      } catch {
        setDeletingIds([]);
      }
    }, 350); // match animation duration
  };

  // Delete a single notification with animation
  const handleDeleteNotification = async (notifId) => {
    setDeletingIds(ids => [...ids, notifId]);
    setTimeout(async () => {
      try {
        await axios.delete(`${API_BASE}/notifications/${notifId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setNotifications(notifications => notifications.filter(n => n._id !== notifId));
        setDeletingIds(ids => ids.filter(id => id !== notifId));
      } catch {
        setDeletingIds(ids => ids.filter(id => id !== notifId));
      }
    }, 350); // match animation duration
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative">
        <FaBell className={iconClassName} style={bellStyle} />
        {notifications.some(n => !n.read) && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-red-200 rounded-lg shadow-lg z-50">
          <div className="p-4 max-h-80 overflow-y-auto">
            <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
              Notifications
            </h4>
            <button
              className="mb-3 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              onClick={handleClearNotifications}
              disabled={notifications.length === 0}
            >
              Clear Notifications
            </button>
            {notifications.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">No notifications</div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={notif._id || idx}
                  className={
                    `mb-3 border-b pb-2 last:border-b-0 last:pb-0 flex justify-between items-start gap-2 transition-all duration-300` +
                    (deletingIds.includes(notif._id) ? " opacity-0 translate-x-8 animate-fade-out" : "")
                  }
                  style={{
                    pointerEvents: deletingIds.includes(notif._id) ? "none" : undefined,
                  }}
                >
                  <div>
                    <div className="font-semibold text-sm">{notif.title}</div>
                    <div className="text-xs text-gray-500">{notif.description}</div>
                    <div className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 text-xs px-2"
                    title="Delete notification"
                    onClick={() => handleDeleteNotification(notif._id)}
                    disabled={deletingIds.includes(notif._id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <style>{`
        .animate-fade-out {
          animation: notifFadeOut 0.35s forwards;
        }
        @keyframes notifFadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(32px); }
        }
      `}</style>
    </div>
  );
}