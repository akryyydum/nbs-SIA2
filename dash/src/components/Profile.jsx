import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { updateUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const BG_IMAGE = "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg";
const DEFAULT_PROFILE_IMAGE = "/profile.jpg";

// Helper to get a unique key for each user (using email as unique id)
const getUserKey = (user) => user?.email ? `profileData_${user.email}` : 'profileData_guest';

const Profile = ({ user }) => {
  const { login } = useAuth();
  // Load from localStorage or fallback to user/defaults
  const getInitialProfile = (userObj) => {
    const key = getUserKey(userObj);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsedData = JSON.parse(saved);
      // If the saved avatar is the old BG_IMAGE, replace it with the new default
      if (parsedData.avatar === BG_IMAGE) {
        parsedData.avatar = DEFAULT_PROFILE_IMAGE;
      }
      return parsedData;
    }
    return {
      name: userObj?.name || '',
      email: userObj?.email || '',
      password: '********',
      avatar: userObj?.avatar || DEFAULT_PROFILE_IMAGE,
    };
  };

  const [profile, setProfile] = useState(getInitialProfile(user));
  const [avatar, setAvatar] = useState(profile.avatar);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({ name: profile.name, password: profile.password });

  // When user changes (login/logout), load their profile from localStorage or fallback
  useEffect(() => {
    const newProfile = getInitialProfile(user);
    setProfile(newProfile);
    setAvatar(newProfile.avatar);
    setEditFields({ name: newProfile.name, password: newProfile.password });
    setEditing(false);
  }, [user]);

  // Save to localStorage on profile or avatar change (per user)
  useEffect(() => {
    const key = getUserKey(profile);
    localStorage.setItem(key, JSON.stringify({ ...profile, avatar }));
  }, [profile, avatar]);

  // Handle edit field changes
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditFields((prev) => ({ ...prev, [name]: value }));
  };

  // Start editing
  const handleEdit = () => {
    setEditFields({ name: profile.name, password: profile.password });
    setEditing(true);
  };

  // Save edits
  const handleSave = async () => {
    try {
      // Prepare update payload
      const payload = {
        name: editFields.name,
        password: editFields.password !== '********' ? editFields.password : undefined,
      };
      // Remove undefined fields (e.g., if password not changed)
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      // Call backend to update user
      const res = await updateUser(user._id, payload, user.token);
      // Update local profile and AuthContext (login info)
      const updatedUser = {
        ...user,
        ...res.data,
        avatar: avatar,
        token: user.token, // keep token unless backend returns new one
      };
      setProfile(updatedUser);
      setEditFields({ name: updatedUser.name, password: '********' });
      setEditing(false);
      // Save to localStorage for persistence
      const key = getUserKey(updatedUser);
      localStorage.setItem(key, JSON.stringify({ ...updatedUser, avatar }));
      // Update AuthContext (so login uses new info)
      login(updatedUser);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Cancel edits
  const handleCancel = () => {
    setEditFields({ name: profile.name, password: profile.password });
    setEditing(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white overflow-x-hidden"
      style={{ overflow: 'hidden', height: '100vh' }}
    >
      {/* Animated gradient overlay */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-200 opacity-30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-200 opacity-30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-yellow-100 opacity-20 rounded-full blur-2xl animate-pulse-fast -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      {/* Background image at top 40% */}
      <div
        className="fixed top-0 left-0 w-full"
        style={{
          height: '40vh',
          background: `url(${BG_IMAGE}) center/cover no-repeat`,
          zIndex: 1,
        }}
      ></div>
      <div className="relative z-10 w-full flex items-center justify-center min-h-screen">
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-4xl w-full bg-white/60 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up min-h-[420px] mx-4 border border-gray-200"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            animation: 'fadeInProfile 0.8s cubic-bezier(.4,0,.2,1)',
            zIndex: 10,
          }}
        >
          {/* Profile Image Section */}
          <div className="md:w-1/3 flex items-center justify-center p-12 bg-white/30 relative">
            <div className="relative z-10 block">
              <img
                src={avatar}
                alt="Profile"
                className="w-56 h-56 rounded-2xl object-cover border-4 border-white shadow-xl bg-gray-100 ring-2 ring-blue-200"
                style={{
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.10)'
                }}
              />
            </div>
            {/* Decorative ring */}
            <div className="absolute top-8 left-8 w-44 h-44 rounded-full border-4 border-blue-100 opacity-40 pointer-events-none"></div>
          </div>
          {/* Divider for desktop */}
          <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent my-12"></div>
          {/* Profile Info */}
          <div className="md:w-2/3 p-12 flex flex-col justify-center bg-white/30">
            <div className="grid grid-cols-1 gap-y-6 text-base mb-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 tracking-wide">NAME:</span>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={editFields.name}
                    onChange={handleFieldChange}
                    className="ml-2 border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full max-w-xs bg-white/80 shadow-sm"
                  />
                ) : (
                  <span className="ml-2 text-gray-900 font-medium">{profile.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-blue-400" />
                <span className="font-semibold text-gray-700 tracking-wide">EMAIL:</span>
                <span className="ml-2 text-gray-900 font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaLock className="text-pink-400" />
                <span className="font-semibold text-gray-700 tracking-wide">PASSWORD:</span>
                {editing ? (
                  <input
                    type="password"
                    name="password"
                    value={editFields.password}
                    onChange={handleFieldChange}
                    className="ml-2 border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full max-w-xs bg-white/80 shadow-sm"
                  />
                ) : (
                  <span className="ml-2 text-gray-900 font-medium">********</span> 
                )}
              </div>
            </div>
            {editing ? (
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg font-semibold shadow hover:from-green-500 hover:to-green-700 transition active:scale-95"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800 rounded-lg font-semibold shadow hover:from-gray-300 hover:to-gray-500 transition active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleEdit}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold shadow hover:from-red-600 hover:to-pink-600 transition self-start active:scale-95"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Fade-in animation keyframes */}
      <style>{`
        @keyframes fadeInProfile {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up {
          animation: fadeInProfile 0.8s cubic-bezier(.4,0,.2,1);
        }
        .animate-pulse-slow {
          animation: pulseSlow 6s infinite alternate;
        }
        .animate-pulse-fast {
          animation: pulseFast 3s infinite alternate;
        }
        @keyframes pulseSlow {
          0% { opacity: 0.2; }
          100% { opacity: 0.4; }
        }
        @keyframes pulseFast {
          0% { opacity: 0.15; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default Profile;