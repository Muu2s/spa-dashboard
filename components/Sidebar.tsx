// File: components/Sidebar.tsx
'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-white shadow-md p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6 text-pink-600">Spa Dashboard</h2>
        <nav className="mt-8 space-y-4">
          <Link href="/dashboard" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600">
            Dashboard
          </Link>
          <Link href="/appointments" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600">
            Appointments
          </Link>
          <Link href="/sales" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600">
            Sales
          </Link>
          <Link href="/services" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600">
            Services
          </Link>
          <Link href="/analytics" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600">
            Analytics
          </Link>
        </nav>
      </div>

      <button
        onClick={onLogout}
        className="mt-8 flex items-center space-x-2 text-red-500 hover:text-red-600"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
