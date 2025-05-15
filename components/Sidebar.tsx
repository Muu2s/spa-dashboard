'use client';

import React, { useState } from 'react';
import { LogOut, LayoutDashboard, Calendar, ShoppingCart, ListChecks, BarChart, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onLogout: () => void;
}

const navigationItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview & quick stats'
  },
  {
    href: '/appointments',
    icon: Calendar,
    label: 'Appointments',
    description: 'Manage bookings'
  },
  {
    href: '/sales',
    icon: ShoppingCart,
    label: 'Sales',
    description: 'Daily transactions'
  },
  {
    href: '/services',
    icon: ListChecks,
    label: 'Services',
    description: 'Manage services'
  },
  {
    href: '/analytics',
    icon: BarChart,
    label: 'Analytics',
    description: 'Performance insights'
  }
];

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActivePath = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </motion.button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          ${isMobileOpen ? 'fixed' : 'hidden md:block'}
          h-screen sticky top-0 left-0 z-40
          bg-gradient-to-b from-white to-gray-50
          border-r border-gray-200 shadow-lg
          flex flex-col
        `}
        style={{ width: isMobileOpen ? '320px' : isCollapsed ? '80px' : '280px' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <motion.div
              animate={{ opacity: isCollapsed && !isMobileOpen ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  OhmyNails
                </h2>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </motion.div>

            {/* Collapse Button - Desktop Only */}
            <div className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* Close Button - Mobile Only */}
            <div className="md:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.href);

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href} onClick={() => setIsMobileOpen(false)}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group
                      ${isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                        : 'hover:bg-gray-100 text-gray-700 hover:text-pink-600'
                      }
                    `}
                  >
                    <div className={`
                      flex-shrink-0 p-2 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-white bg-opacity-20'
                        : 'group-hover:bg-pink-50'
                      }
                    `}>
                      <Icon className={`
                        w-5 h-5 transition-colors duration-200
                        ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-pink-600'}
                      `} />
                    </div>

                    <motion.div
                      animate={{ 
                        opacity: isCollapsed && !isMobileOpen ? 0 : 1,
                        width: isCollapsed && !isMobileOpen ? 0 : 'auto'
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="font-medium">{item.label}</div>
                      {!isActive && (
                        <div className="text-xs text-gray-500 group-hover:text-pink-500 transition-colors">
                          {item.description}
                        </div>
                      )}
                    </motion.div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <motion.div
            animate={{ opacity: isCollapsed && !isMobileOpen ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AS</span>
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-gray-900 text-sm">Admin User</div>
                <div className="text-xs text-gray-500">Salon Manager</div>
              </div>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className={`
              w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
              text-red-600 hover:bg-red-50 hover:text-red-700 group
            `}
          >
            <div className="flex-shrink-0 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <motion.span
              animate={{ opacity: isCollapsed && !isMobileOpen ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="font-medium"
            >
              Logout
            </motion.span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}