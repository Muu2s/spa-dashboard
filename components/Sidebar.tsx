// File: components/Sidebar.tsx
'use client';

import React from 'react';
import { LogOut, LayoutDashboard, Calendar, ShoppingCart, ListChecks, BarChart } from 'lucide-react';
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
          <Link href="/dashboard" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600 flex items-center space-x-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/appointments" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Appointments</span>
          </Link>
          <Link href="/sales" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600 flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Sales</span>
          </Link>
          <Link href="/services" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600 flex items-center space-x-2">
            <ListChecks className="w-4 h-4" />
            <span>Services</span>
          </Link>
          <Link href="/analytics" className="block px-4 py-2 text-gray-900 hover:bg-pink-50 hover:text-pink-600 flex items-center space-x-2">
            <BarChart className="w-4 h-4" />
            <span>Analytics</span>
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
