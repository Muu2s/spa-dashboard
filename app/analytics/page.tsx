'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

interface Sale {
  id: string;
  service: string;
  amount: number;
  created_at: string;
}

interface Appointment {
  id: string;
  service_id: string;
  customer_name: string;
  date: string;
  status: string;
}

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodSales, setPeriodSales] = useState<SalesPeriod>({
    daily: 0,
    weekly: 0,
    monthly: 0
  });

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
        .order('created_at', { ascending: false });

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false });

      if (salesError) throw new Error(`Sales fetch error: ${salesError.message}`);
      if (appointmentsError) throw new Error(`Appointments fetch error: ${appointmentsError.message}`);

      setSales(salesData || []);
      setAppointments(appointmentsData || []);

      // Calculate period sales
      if (salesData) {
        const dailySales = salesData
          .filter(sale => dayjs(sale.created_at).isAfter(startOfDay))
          .reduce((sum, sale) => sum + sale.amount, 0);

        const weeklySales = salesData
          .filter(sale => dayjs(sale.created_at).isAfter(startOfWeek))
          .reduce((sum, sale) => sum + sale.amount, 0);

        const monthlySales = salesData
          .filter(sale => dayjs(sale.created_at).isAfter(startOfMonth))
          .reduce((sum, sale) => sum + sale.amount, 0);

        setPeriodSales({
          daily: dailySales,
          weekly: weeklySales,
          monthly: monthlySales
        });
      }
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

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalAppointments = appointments.length;

  const revenueByService = sales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.service] = (acc[sale.service] || 0) + sale.amount;
    return acc;
  }, {});

  const chartData: ChartData[] = Object.entries(revenueByService).map(([service, amount]) => ({
    service,
    amount,
  }));

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

        {error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded mb-4">
            {error}
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Today&apos;s Revenue</h2>
                <p className="text-2xl text-pink-600">RM {periodSales.daily.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Weekly Revenue</h2>
                <p className="text-2xl text-pink-600">RM {periodSales.weekly.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Monthly Revenue</h2>
                <p className="text-2xl text-pink-600">RM {periodSales.monthly.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
                <p className="text-2xl text-pink-600">RM {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <h2 className="text-lg font-semibold mb-2">Total Appointments</h2>
                <p className="text-2xl text-pink-600">{totalAppointments}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-4">Revenue by Service</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="service" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No revenue data available</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
