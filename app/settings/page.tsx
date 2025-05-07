// File: app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

interface AdminUser {
  id: string;
  email: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    fetchUserEmail();
    fetchAdmins();
  }, []);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setEmail(user.email || '');
  };

  const fetchAdmins = async () => {
    const { data, error } = await supabase.from('admins').select('*');
    if (!error) setAdmins(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setStatus(`Error: ${error.message}`);
    else {
      setStatus('Password updated successfully');
      setNewPassword('');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    const { error } = await supabase.from('admins').insert({ email: newAdminEmail });
    if (error) setStatus(`Error: ${error.message}`);
    else {
      setStatus('Admin added successfully');
      setNewAdminEmail('');
      fetchAdmins();
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="bg-white p-4 rounded shadow-sm max-w-md mb-6">
          <p className="mb-4">Logged in as: <strong>{email}</strong></p>

          <div className="mb-4">
            <label className="block mb-1 font-medium">New Password</label>
            <input
              type="password"
              className="p-2 border rounded w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <button
            onClick={handleChangePassword}
            className="px-4 py-2 bg-pink-600 text-white rounded"
          >
            Update Password
          </button>

          {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
        </div>

        <div className="bg-white p-4 rounded shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-4">Manage Admins</h2>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Add New Admin Email</label>
            <input
              type="email"
              className="p-2 border rounded w-full"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <button
            onClick={handleAddAdmin}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Add Admin
          </button>

          <h3 className="mt-6 font-semibold">Current Admins:</h3>
          <ul className="list-disc list-inside">
            {admins.map(admin => (
              <li key={admin.id}>{admin.email}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}