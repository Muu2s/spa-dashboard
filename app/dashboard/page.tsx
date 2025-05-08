'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Appointment {
  id: string;
  customer_name: string;
  services: Service[];
  staff?: string;
  date: string;
  time: string;
  total_duration: number;
  total_price: number;
}

interface Sale {
  id: string;
  customer_name: string;
  service: string;
  amount: number;
  date: string;
  staff?: string;
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
  }, [today]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const todayRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

  const handleMarkAsDone = async (appointment: Appointment) => {
    try {
      // Create sales record
      const salesData = {
        customer_name: appointment.customer_name,
        service: appointment.services.map(s => s.name).join(', '),
        amount: appointment.total_price,
        date: today,
        staff: appointment.staff || null
      };

      // Create the sale record
      const { error: salesError } = await supabase
        .from('sales')
        .insert([salesData]);

      if (salesError) throw salesError;

      // Delete the appointment
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (deleteError) throw deleteError;

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err) {
      console.error('Error marking appointment as done:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Dashboard</h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Today&apos;s Revenue</h2>
            <p className="text-2xl text-pink-600">RM {todayRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Appointments Today</h2>
            <p className="text-2xl">{appointments.length}</p>
          </div>
        </div>

        {/* Appointment List */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Appointments</h2>
          {appointments.length === 0 ? (
            <p>No appointments today.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3 text-gray-900">Time</th>
                  <th className="p-3 text-gray-900">Customer</th>
                  <th className="p-3 text-gray-900">Services</th>
                  <th className="p-3 text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{appointment.time}</td>
                    <td className="p-3 text-gray-700">{appointment.customer_name}</td>
                    <td className="p-3 text-gray-700">
                      {appointment.services.map(s => s.name).join(', ')}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleMarkAsDone(appointment)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Mark as Done"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
