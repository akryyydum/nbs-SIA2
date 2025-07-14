import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`;

export default function Notifications({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative">
        <FaBell className="h-7 w-7" />
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
            {notifications.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">No notifications</div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif._id || idx} className="mb-3 border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="font-semibold text-sm">{notif.title}</div>
                  <div className="text-xs text-gray-500">{notif.description}</div>
                  <div className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}