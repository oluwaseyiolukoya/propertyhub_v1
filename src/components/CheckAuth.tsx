import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';

export default function CheckAuth() {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        setAuthInfo({ error: 'No token found. Please login first.' });
        setLoading(false);
        return;
      }

      // Decode JWT to see what's in it
      const payload = JSON.parse(atob(token.split('.')[1]));

      setAuthInfo({
        token: token.substring(0, 20) + '...',
        decoded: payload,
        hasCustomerId: !!payload.customerId,
        role: payload.role,
        email: payload.email,
      });

      setLoading(false);
    } catch (error: any) {
      setAuthInfo({ error: error.message });
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Authentication Check</h1>

      {authInfo.error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{authInfo.error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Token Info:</h2>
            <p className="text-sm text-gray-600 font-mono">{authInfo.token}</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-2">User Info:</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-mono">{authInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-mono">{authInfo.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer ID:</span>
                <span className="font-mono">{authInfo.decoded.customerId || 'null'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono">{authInfo.decoded.id}</span>
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${authInfo.hasCustomerId ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h2 className="font-semibold mb-2">Storage Access:</h2>
            {authInfo.hasCustomerId ? (
              <div className="text-green-800">
                <p className="font-semibold">✅ You CAN access storage!</p>
                <p className="text-sm mt-1">Your account has a customerId: {authInfo.decoded.customerId}</p>
              </div>
            ) : (
              <div className="text-red-800">
                <p className="font-semibold">❌ You CANNOT access storage</p>
                <p className="text-sm mt-1">Your account does not have a customerId</p>
                <p className="text-sm mt-2">This usually means:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  <li>You're logged in as an admin user</li>
                  <li>You're logged in as an internal user</li>
                  <li>Your developer account is not properly set up</li>
                </ul>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Full Token Payload:</h2>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
              {JSON.stringify(authInfo.decoded, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

