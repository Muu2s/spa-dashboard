'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Calendar } from 'react-date-range';
// @ts-ignore
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import styles from './DashboardCalendar.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Popover, Transition } from '@headlessui/react';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = dayjs();
      const startDate = today.format('YYYY-MM-DD');
      const endDate = today.add(7, 'day').format('YYYY-MM-DD');

      const { data: allAppointments, error: aError } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date, time');

      if (aError) {
        setError(aError.message);
        setAppointments([]);
      } else {
        setAppointments(allAppointments || []);
      }

      const { data: todaySales, error: sError } = await supabase
        .from('sales')
        .select('*')
        .eq('date', today.format('YYYY-MM-DD'));

      if (sError) {
        setError(sError.message);
        setSales([]);
      } else {
        setSales(todaySales || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const todayRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

  const handleMarkAsDone = async (appointment: Appointment, today: dayjs.Dayjs) => {
    try {
      // Create sales record
      const salesData = {
        customer_name: appointment.customer_name,
        service: appointment.services.map(s => s.name).join(', '),
        amount: appointment.total_price,
        date: today.format('YYYY-MM-DD'),
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
      setSuccessMessage('Appointment marked as done!');
      setTimeout(() => setSuccessMessage(null), 3000);
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

        {loading && (
          <div className="mb-6 p-3 rounded">
            Loading dashboard data...
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 p-3 rounded">
            <p>An error occurred while fetching dashboard data.</p>
            <p>Please try again later.</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 text-green-500 p-3 rounded">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Today's Revenue</h2>
            <p className="text-3xl font-bold text-pink-600">RM {todayRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Appointments Today</h2>
            <p className="text-3xl font-bold">{appointments.filter(appointment => appointment.date === dayjs().format('YYYY-MM-DD')).length}</p>
          </div>
        </div>

        {/* Appointment List */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Today's Appointments</h2>
          {appointments.filter(appointment => appointment.date === dayjs().format('YYYY-MM-DD')).length === 0 ? (
            <p>No appointments scheduled for today. Consider creating a new appointment.</p>
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
                {appointments.filter(appointment => appointment.date === dayjs().format('YYYY-MM-DD')).map((appointment) => (
                  <tr key={appointment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{appointment.time}</td>
                    <td className="p-3 text-gray-700">{appointment.customer_name}</td>
                    <td className="p-3 text-gray-700">
                      {appointment.services.map(s => s.name).join(', ')}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleMarkAsDone(appointment, dayjs())}
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

        {/* Calendar and Future Appointments Side by Side */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow w-full md:w-1/2">
            <h2 className="text-lg font-semibold mb-3">Weekly Appointments</h2>
            {hydrated && (
              <div className="relative block w-full">
                {/* Calendar component (react-date-range) */}
                <Calendar
                  date={calendarDate}
                  onChange={(date: Date) => {
                    setCalendarDate(date);
                    setSelectedDate(date);
                    setSelectedAppointments(appointments.filter(appointment => appointment.date === dayjs(date).format('YYYY-MM-DD')));
                  }}
                  color="#be185d"
                  showDateDisplay={false}
                />
              </div>
            )}
          </div>
          <div className="bg-white p-4 rounded shadow w-full md:w-1/2">
            <h2 className="text-lg font-semibold mb-3">Appointments on {dayjs(selectedDate).format('DD MMM YYYY')}</h2>
            {selectedAppointments.length === 0 ? (
              <p>No appointments scheduled for this day.</p>
            ) : (
              <ul>
                {selectedAppointments.map((appointment) => (
                  <li key={appointment.id} className="mb-2 p-2 rounded hover:bg-pink-50">
                    <span className="font-semibold">{appointment.time}</span> - {appointment.customer_name} ({appointment.services.map(s => s.name).join(', ')})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
