'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Sale {
  id: string;
  customer_name: string;
  service: string;
  amount: number;
  date: string;
  created_at?: string;
  staff?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [searchTerm, setSearchTerm] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');

  const staffList = [...new Set(sales.map(sale => sale.staff).filter(Boolean))];

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  useEffect(() => {
    // Filter sales based on search term and staff filter
    let filtered = sales;

    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (staffFilter !== 'all') {
      filtered = filtered.filter(sale => sale.staff === staffFilter);
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, staffFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });

      if (fetchError) throw new Error(fetchError.message);
      setSales(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const salesCount = filteredSales.length;
  const averageSale = salesCount > 0 ? totalSales / salesCount : 0;

  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isToday ? "Today's Sales" : `Sales for ${formatDate(selectedDate)}`}
          </h1>
          <p className="text-gray-600">Track your salon's daily performance</p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm"
            >
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 mr-2" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Selector and Filters */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Staff Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Staff
              </label>
              <div className="relative">
                <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="all">All Staff</option>
                  {staffList.map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-end gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedDate(dayjs().format('YYYY-MM-DD'));
                  setSearchTerm('');
                  setStaffFilter('all');
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset
              </motion.button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-pink-100">Total Sales</h3>
                <p className="text-3xl font-bold mt-2">RM {totalSales.toFixed(2)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-100">Total Transactions</h3>
                <p className="text-3xl font-bold mt-2">{salesCount}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-100">Average Sale</h3>
                <p className="text-3xl font-bold mt-2">RM {averageSale.toFixed(2)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <ArrowTrendingUpIcon className="h-8 w-8" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : filteredSales.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg"
          >
            <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {sales.length === 0 ? 'No sales recorded' : 'No sales match your filters'}
            </h3>
            <p className="text-gray-500">
              {sales.length === 0 
                ? `No sales have been recorded for ${isToday ? 'today' : formatDate(selectedDate)} yet`
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {filteredSales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <UserIcon className="h-5 w-5 text-pink-500 mr-2" />
                          {sale.customer_name}
                        </h3>
                        <p className="text-gray-600 mt-1">{sale.service}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-pink-600">
                          RM {sale.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm">
                          {sale.created_at ? formatDateTime(sale.created_at) : formatDate(sale.date)}
                        </span>
                      </div>

                      {sale.staff && (
                        <div className="flex items-center text-gray-600">
                          <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="text-sm">Served by {sale.staff}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {filteredSales.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h4 className="text-gray-300 text-sm">Total Revenue</h4>
                <p className="text-2xl font-bold">RM {totalSales.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-gray-300 text-sm">Total Transactions</h4>
                <p className="text-2xl font-bold">{salesCount}</p>
              </div>
              <div>
                <h4 className="text-gray-300 text-sm">Average per Transaction</h4>
                <p className="text-2xl font-bold">RM {averageSale.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}