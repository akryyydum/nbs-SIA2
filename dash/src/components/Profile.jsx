import React from 'react';

const Profile = ({ user }) => {
  return (
    <div className="max-w-md mx-auto bg-gradient-to-r from-gray-100 to-gray-200 shadow-xl rounded-lg p-8">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">User Profile</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <label className="text-lg font-semibold text-gray-700">Name:</label>
          <span className="text-lg text-gray-900">{user.name}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-3">
          <label className="text-lg font-semibold text-gray-700">Email:</label>
          <span className="text-lg text-gray-900">{user.email}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-3">
          <label className="text-lg font-semibold text-gray-700">Role:</label>
          <span className="text-lg text-gray-900">{user.role}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-3">
          <label className="text-lg font-semibold text-gray-700">Password:</label>
          <span className="text-lg text-gray-900">********</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;