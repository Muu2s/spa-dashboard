'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface Appointment {
  id: string;
  time: string;
  customer_name: string;
  service: string;
  staff: string;
  date: string;
}

interface Sale {
  id: string;
  amount: number;
  date: string;
}

interface ServiceCount {
  [key: string]: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = dayjs().format('YYYY-MM-DD');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: todayAppointments, error: aError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', today)
        .order('time');

      const { data: todaySales, error: sError } = await supabase
        .from('sales')
        .select('*')
        .eq('date', today);

      if (aError) throw new Error(`Appointments error: ${aError.message}`);
      if (sError) throw new Error(`Sales error: ${sError.message}`);

      setAppointments(todayAppointments || []);
      setSales(todaySales || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on any props or state

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Add dependency

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

  const serviceFrequency = appointments.reduce<ServiceCount>((acc, appointment) => {
    acc[appointment.service] = (acc[appointment.service] || 0) + 1;
    return acc;
  }, {});

  const topServices = Object.entries(serviceFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

        {loading ? (
          <p>Loading dashboard...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
            {/* Top Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold">Today's Revenue</h2>
                <p className="text-2xl text-pink-600">RM {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold">Appointments Today</h2>
                <p className="text-2xl">{appointments.length}</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold">Top Services</h2>
                {topServices.length === 0 ? (
                  <p className="text-gray-500">No data</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {topServices.map(([name, count]) => (
                      <li key={name} className="text-sm">{name}: {count} times</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Appointment List */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">Today’s Appointments</h2>
              {appointments.length === 0 ? (
                <p>No appointments today.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Service</th>
                      <th className="p-2 text-left">Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{a.time}</td>
                        <td className="p-2">{a.customer_name}</td>
                        <td className="p-2">{a.service}</td>
                        <td className="p-2">{a.staff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
