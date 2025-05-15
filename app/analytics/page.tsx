'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { exportSalesToExcel } from './exportSalesToExcel';
import { Sale } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  FunnelIcon,
  ChartPieIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

dayjs.extend(isSameOrAfter);

interface ChartData {
  service: string;
  amount: number;
  color?: string;
}

interface SalesPeriod {
  daily: number;
  weekly: number;
  monthly: number;
}

interface DailyRevenue {
  date: string;
  amount: number;
}

const COLORS = [
  '#FF6B8A', '#4FACFE', '#43E97B', '#FA709A', '#FDBB2D',
  '#FF9A9E', '#A8EDEA', '#D299C2', '#FED6E3', '#D585FF'
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodSales, setPeriodSales] = useState<SalesPeriod>({
    daily: 0,
    weekly: 0,
    monthly: 0
  });
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar'>('pie');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = dayjs();
      const startOfDay = today.startOf('day').toISOString();
      const startOfWeek = today.startOf('week').toISOString();
      const startOfMonth = today.startOf('month').toISOString();

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });

      if (salesError) throw new Error(`Sales fetch error: ${salesError.message}`);

      setSales(salesData || []);

      // Calculate period sales
      if (salesData) {
        const dailySales = salesData
          .filter(sale => dayjs(sale.date).isSameOrAfter(startOfDay))
          .reduce((sum, sale) => sum + sale.amount, 0);

        const weeklySales = salesData
          .filter(sale => dayjs(sale.date).isSameOrAfter(startOfWeek))
          .reduce((sum, sale) => sum + sale.amount, 0);

        const monthlySales = salesData
          .filter(sale => dayjs(sale.date).isSameOrAfter(startOfMonth))
          .reduce((sum, sale) => sum + sale.amount, 0);

        setPeriodSales({
          daily: dailySales,
          weekly: weeklySales,
          monthly: monthlySales
        });
      }

      // Calculate completed appointments from sales data
      const completedCount = salesData?.filter(sale => 
        dayjs(sale.date).isSame(dayjs(), 'day')
      ).length || 0;

      setCompletedAppointments(completedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Calculate revenue by service
  const revenueByService = sales.reduce<Record<string, number>>((acc, sale) => {
    if (sale.service) {
      acc[sale.service] = (acc[sale.service] || 0) + sale.amount;
    }
    return acc;
  }, {});

  const chartData: ChartData[] = Object.entries(revenueByService)
    .map(([service, amount], index) => ({
      service,
      amount,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate daily revenue for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(i, 'day');
    const dayRevenue = sales
      .filter(sale => dayjs(sale.date).isSame(date, 'day'))
      .reduce((sum, sale) => sum + sale.amount, 0);
    
    return {
      date: date.format('MMM DD'),
      amount: dayRevenue
    };
  }).reverse();

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageDailyRevenue = totalRevenue / Math.max(1, sales.length > 0 ? dayjs().diff(dayjs(sales[sales.length - 1]?.date), 'day') + 1 : 1);

  const handleExportSales = async (period: 'weekly' | 'monthly') => {
    try {
      await exportSalesToExcel(sales, period);
    } catch (err) {
      setError('Failed to export sales data');
    }
  };

  const salesGrowth = periodSales.weekly > 0 
    ? ((periodSales.weekly - (periodSales.monthly - periodSales.weekly)) / Math.max(1, periodSales.monthly - periodSales.weekly)) * 100
    : 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your salon's performance and insights</p>
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-pink-100">Today's Sales</h3>
                    <p className="text-3xl font-bold mt-2">RM {periodSales.daily.toFixed(2)}</p>
                    <p className="text-pink-100 text-sm mt-1">{completedAppointments} appointments</p>
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
                    <h3 className="text-sm font-medium text-blue-100">Weekly Sales</h3>
                    <p className="text-3xl font-bold mt-2">RM {periodSales.weekly.toFixed(2)}</p>
                    <p className="text-blue-100 text-sm mt-1">
                      {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}% growth
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <CalendarDaysIcon className="h-8 w-8" />
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
                    <h3 className="text-sm font-medium text-green-100">Monthly Sales</h3>
                    <p className="text-3xl font-bold mt-2">RM {periodSales.monthly.toFixed(2)}</p>
                    <p className="text-green-100 text-sm mt-1">This month</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <ChartBarIcon className="h-8 w-8" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-100">Total Revenue</h3>
                    <p className="text-3xl font-bold mt-2">RM {totalRevenue.toFixed(2)}</p>
                    <p className="text-orange-100 text-sm mt-1">All time</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <ArrowTrendingUpIcon className="h-8 w-8" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Export Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Export Sales Data</h2>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExportSales('weekly')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Export Weekly Sales
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExportSales('monthly')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Export Monthly Sales
                </motion.button>
              </div>
            </motion.div>

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue by Service */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Revenue by Service</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedChartType('pie')}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedChartType === 'pie'
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ChartPieIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedChartType('bar')}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedChartType === 'bar'
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Bars3BottomLeftIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      {selectedChartType === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="service"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ service, percent }) => `${service} ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`RM ${value}`, 'Revenue']} />
                        </PieChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="service" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`RM ${value}`, 'Revenue']} />
                          <Bar dataKey="amount" fill="#FF6B8A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                    
                    {/* Service Revenue List */}
                    <div className="mt-6 space-y-2">
                      {chartData.slice(0, 5).map((item, index) => (
                        <div key={item.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded mr-3"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium text-gray-900">{item.service}</span>
                          </div>
                          <span className="font-semibold text-pink-600">RM {item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ChartPieIcon className="h-16 w-16 mb-4 text-gray-300" />
                    <p>No service data available</p>
                  </div>
                )}
              </motion.div>

              {/* Daily Revenue Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Revenue (Last 7 Days)</h2>
                
                {last7Days.some(day => day.amount > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={last7Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`RM ${value}`, 'Revenue']} />
                        <Bar dataKey="amount" fill="#4FACFE" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Daily Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-blue-700 text-sm font-medium">Average Daily</h4>
                        <p className="text-2xl font-bold text-blue-800">
                          RM {(last7Days.reduce((sum, day) => sum + day.amount, 0) / 7).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-green-700 text-sm font-medium">Best Day</h4>
                        <p className="text-2xl font-bold text-green-800">
                          RM {Math.max(...last7Days.map(day => day.amount)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ChartBarIcon className="h-16 w-16 mb-4 text-gray-300" />
                    <p>No revenue data for the past 7 days</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 text-white"
            >
              <h2 className="text-xl font-bold mb-6">Quick Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-2">
                    <CheckCircleIcon className="h-8 w-8 mx-auto" />
                  </div>
                  <h4 className="text-gray-300 text-sm">Appointments Completed</h4>
                  <p className="text-3xl font-bold">{completedAppointments}</p>
                  <p className="text-gray-400 text-sm">Today</p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-2">
                    <CurrencyDollarIcon className="h-8 w-8 mx-auto" />
                  </div>
                  <h4 className="text-gray-300 text-sm">Average Daily Revenue</h4>
                  <p className="text-3xl font-bold">RM {averageDailyRevenue.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm">Overall</p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-2">
                    <ArrowTrendingUpIcon className="h-8 w-8 mx-auto" />
                  </div>
                  <h4 className="text-gray-300 text-sm">Growth Rate</h4>
                  <p className="text-3xl font-bold">
                    {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
                  </p>
                  <p className="text-gray-400 text-sm">Week over week</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}