'use client';

import React, { useState, useEffect } from 'react';
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

  // Auto-open dropdown based on current path (if needed in the future)
  useEffect(() => {
    // Code is removed since there are no dropdown items anymore
  }, [pathname]);
  
  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

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
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 text-gray-700" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700" />
          )}
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
          transition: { duration: 0.3, ease: 'easeInOut' }
        }}
        className={`
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          fixed md:relative h-screen z-40
          bg-gradient-to-b from-white to-gray-50
          border-r border-gray-200 shadow-lg
          flex flex-col transition-transform duration-300
        `}
        style={{ width: isMobileOpen ? '280px' : isCollapsed ? '80px' : '280px' }}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {(!isCollapsed || isMobileOpen) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
              )}
            </AnimatePresence>

            {isCollapsed && !isMobileOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-auto"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            )}

            {/* Toggle Buttons */}
            <div>
              {/* Collapse Button - Desktop Only */}
              <div className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Regular Link */}
                  <Link href={item.href} onClick={() => setIsMobileOpen(false)}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`
                        flex items-center justify-between space-x-3 p-3 rounded-xl transition-all duration-200 group
                        ${isActive
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : 'hover:bg-gray-100 text-gray-700 hover:text-pink-600'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
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

                        {(!isCollapsed || isMobileOpen) && (
                          <div className="overflow-hidden">
                            <div className="font-medium">{item.label}</div>
                            {!isActive && (
                              <div className="text-xs text-gray-500 group-hover:text-pink-500 transition-colors">
                                {item.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Active Indicator */}
                      {isActive && !isCollapsed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {(!isCollapsed || isMobileOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
          )}

          {isCollapsed && !isMobileOpen && (
            <div className="mb-4 flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AS</span>
              </div>
            </div>
          )}

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
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-medium">Logout</span>
            )}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}