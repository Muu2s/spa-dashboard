// File: components/Sidebar.tsx
'use client';

import React from 'react';
import { LogOut, Calendar, DollarSign, LayoutDashboard, Scissors, BarChart2 } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-white border-r shadow-sm p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6 text-pink-600">Spa Dashboard</h2>
        <nav className="space-y-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-gray-700 hover:text-pink-600">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/appointments" className="flex items-center space-x-2 text-gray-700 hover:text-pink-600">
            <Calendar className="w-5 h-5" />
            <span>Appointments</span>
          </Link>
          <Link href="/sales" className="flex items-center space-x-2 text-gray-700 hover:text-pink-600">
            <DollarSign className="w-5 h-5" />
            <span>Sales</span>
          </Link>
          <Link href="/services" className="flex items-center space-x-2 text-gray-700 hover:text-pink-600">
            <Scissors className="w-5 h-5" />
            <span>Services</span>
          </Link>
          <Link href="/analytics" className="flex items-center space-x-2 text-gray-700 hover:text-pink-600">
            <BarChart2 className="w-5 h-5" />
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
