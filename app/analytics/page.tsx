'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { exportSalesToExcel } from './exportSalesToExcel';
import { Sale } from './types';

dayjs.extend(isSameOrAfter);

interface ChartData {
  service: string;
  amount: number;
}

interface SalesPeriod {
  daily: number;
  weekly: number;
  monthly: number;
}

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

  // Update revenue calculation for single service
  const revenueByService = sales.reduce<Record<string, number>>((acc, sale) => {
    if (sale.service) {
      acc[sale.service] = (acc[sale.service] || 0) + sale.amount;
    }
    return acc;
  }, {});

  const chartData: ChartData[] = Object.entries(revenueByService)
    .map(([service, amount]) => ({
      service,
      amount
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>

        {error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded mb-4">{error}</div>
        ) : loading ? (
          <p>Loading analytics...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Today&apos;s Sales</h2>
                <p className="text-2xl text-pink-600">RM {periodSales.daily.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Weekly Sales</h2>
                <p className="text-2xl text-pink-600">RM {periodSales.weekly.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Monthly Sales</h2>
                <p className="text-2xl text-pink-600">RM {periodSales.monthly.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
                <p className="text-2xl text-pink-600">RM {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Completed Appointments</h2>
                <p className="text-2xl text-pink-600">{completedAppointments}</p>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <button
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                onClick={() => exportSalesToExcel(sales, 'weekly')}
              >
                Download Weekly Sales (Excel)
              </button>
              <button
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                onClick={() => exportSalesToExcel(sales, 'monthly')}
              >
                Download Monthly Sales (Excel)
              </button>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-4">Revenue by Service</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={chartData}
                      dataKey="amount"
                      nameKey="service"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
