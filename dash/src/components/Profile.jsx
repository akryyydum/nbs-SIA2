import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaUserEdit } from 'react-icons/fa';
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#fbeee6] to-[#e0e7ff] overflow-x-hidden"
      style={{ overflow: 'hidden', height: '100vh' }}
    >
      {/* Animated gradient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-pink-300 via-purple-200 to-blue-200 opacity-40 rounded-full blur-3xl animate-blob1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-yellow-200 via-pink-200 to-pink-400 opacity-30 rounded-full blur-3xl animate-blob2"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-br from-blue-100 via-pink-100 to-yellow-100 opacity-20 rounded-full blur-2xl animate-blob3 -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      {/* Glassmorphism Profile Card */}
      <div className="relative z-10 w-full flex items-center justify-center min-h-screen">
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-4xl w-full bg-white/40 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up min-h-[440px] mx-4 border border-white/30"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            animation: 'fadeInProfile 0.8s cubic-bezier(.4,0,.2,1)',
            zIndex: 10,
          }}
        >
          {/* Profile Image Section */}
          <div className="md:w-1/3 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-white/60 to-blue-50 relative">
            <div className="relative z-10 block">
              <img
                src={avatar}
                alt="Profile"
                className="w-56 h-56 rounded-3xl object-cover border-8 border-gradient-pink shadow-2xl bg-gray-100 ring-4 ring-pink-200 animate-avatar-float"
                style={{
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.10)'
                }}
              />
              {/* Floating colored ring */}
              <div className="absolute -top-6 -left-6 w-64 h-64 rounded-full border-4 border-pink-200 opacity-30 pointer-events-none animate-pulse-slow"></div>
            </div>
            {/* Decorative gradient ring */}
            <div className="absolute top-10 left-10 w-44 h-44 rounded-full border-4 border-gradient-pink opacity-40 pointer-events-none"></div>
          </div>
          {/* Divider for desktop */}
          <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-pink-200 to-transparent my-12"></div>
          {/* Profile Info */}
          <div className="md:w-2/3 p-12 flex flex-col justify-center bg-white/40">
            <div className="grid grid-cols-1 gap-y-7 text-base mb-8">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-pink-600 tracking-wide">NAME:</span>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={editFields.name}
                    onChange={handleFieldChange}
                    className="ml-2 border border-pink-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full max-w-xs bg-white/80 shadow-sm transition-all duration-200"
                  />
                ) : (
                  <span className="ml-2 text-gray-900 font-bold text-lg">{profile.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-blue-400" />
                <span className="font-semibold text-blue-600 tracking-wide">EMAIL:</span>
                <span className="ml-2 text-gray-900 font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaLock className="text-pink-400" />
                <span className="font-semibold text-pink-600 tracking-wide">PASSWORD:</span>
                {editing ? (
                  <input
                    type="password"
                    name="password"
                    value={editFields.password}
                    onChange={handleFieldChange}
                    className="ml-2 border border-pink-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full max-w-xs bg-white/80 shadow-sm transition-all duration-200"
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
                  className="px-7 py-2 bg-gradient-to-r from-pink-500 via-red-400 to-yellow-400 text-white rounded-xl font-semibold shadow-lg hover:from-pink-600 hover:to-yellow-500 transition-all duration-200 active:scale-95 animate-btn-pop"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-7 py-2 bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800 rounded-xl font-semibold shadow hover:from-gray-300 hover:to-gray-500 transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleEdit}
                className="mt-4 px-7 py-2 bg-gradient-to-r from-pink-500 via-red-400 to-yellow-400 text-white rounded-xl font-semibold shadow-lg hover:from-pink-600 hover:to-yellow-500 transition-all duration-200 self-start active:scale-95 flex items-center gap-2 animate-btn-pop"
              >
                <FaUserEdit className="text-lg" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Animations and custom gradients */}
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
        @keyframes pulseSlow {
          0% { opacity: 0.2; }
          100% { opacity: 0.4; }
        }
        .animate-avatar-float {
          animation: avatarFloat 3.5s ease-in-out infinite alternate;
        }
        @keyframes avatarFloat {
          0% { transform: translateY(0);}
          100% { transform: translateY(-12px);}
        }
        .border-gradient-pink {
          border-image: linear-gradient(135deg, #f472b6 30%, #fbbf24 100%) 1;
        }
        .animate-btn-pop {
          animation: btnPop 0.25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes btnPop {
          0% { transform: scale(1);}
          50% { transform: scale(1.08);}
          100% { transform: scale(1);}
        }
        .animate-blob1 {
          animation: blobMove1 12s ease-in-out infinite alternate;
        }
        .animate-blob2 {
          animation: blobMove2 14s ease-in-out infinite alternate;
        }
        .animate-blob3 {
          animation: blobMove3 10s ease-in-out infinite alternate;
        }
        @keyframes blobMove1 {
          0% { transform: translate(0,0) scale(1);}
          100% { transform: translate(60px,40px) scale(1.1);}
        }
        @keyframes blobMove2 {
          0% { transform: translate(0,0) scale(1);}
          100% { transform: translate(-40px,-60px) scale(1.08);}
        }
        @keyframes blobMove3 {
          0% { transform: translate(-50%, -50%) scale(1);}
          100% { transform: translate(-60%, -60%) scale(1.12);}
        }
      `}</style>
    </div>
  );
};

export default Profile;