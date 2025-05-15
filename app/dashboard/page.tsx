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
import { AnimatePresence, motion } from 'framer-motion';
import { Popover, Transition } from '@headlessui/react';
import { BadgeCheck, Calendar as CalendarIcon, CreditCard, User, Clock, X } from 'lucide-react';

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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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

  // Set selected appointments whenever date changes
  useEffect(() => {
    setSelectedAppointments(
      appointments.filter(appointment => appointment.date === dayjs(selectedDate).format('YYYY-MM-DD'))
    );
  }, [selectedDate, appointments]);

  const todayRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const todayAppointments = appointments.filter(appointment => appointment.date === dayjs().format('YYYY-MM-DD'));

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
      setSuccessMessage(`Appointment for ${appointment.customer_name} marked as completed!`);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        setTimeout(() => setSuccessMessage(null), 300);
      }, 3000);
    } catch (err) {
      console.error('Error marking appointment as done:', err);
      setError('Failed to mark appointment as done. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getDayHasAppointment = (date: Date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return appointments.some(appointment => appointment.date === dateStr);
  };

  // Function to get total appointments for a day
  const getAppointmentCountForDay = (date: Date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return appointments.filter(appointment => appointment.date === dateStr).length;
  };

  // Custom day renderer for the calendar
  const customDayContent = (day: Date) => {
    const appointmentCount = getAppointmentCountForDay(day);
    const isToday = dayjs(day).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    
    return (
      <div className="relative h-full w-full">
        <div className={`text-center ${isToday ? 'font-bold' : ''}`}>{day.getDate()}</div>
        {appointmentCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <div className="bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {appointmentCount}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onLogout={handleLogout} />
      
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 md:mb-0">Dashboard</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">
                {dayjs().format('dddd, MMMM D, YYYY')}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-white shadow rounded-lg flex items-center justify-center"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading dashboard data...</span>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg shadow-sm border border-red-100 flex items-start"
              >
                <div className="mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">An error occurred while fetching dashboard data.</p>
                  <p className="text-sm mt-1">Please try again later or contact support if the issue persists.</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Popup */}
          <AnimatePresence>
            {showSuccessPopup && successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg shadow-sm border border-green-100 flex items-center"
              >
                <BadgeCheck className="w-5 h-5 mr-2" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Today's Revenue */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-3">
                <div className="rounded-full p-2 bg-pink-100">
                  <CreditCard className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="ml-3 text-lg font-medium text-gray-700">Today's Revenue</h2>
              </div>
              <p className="text-3xl font-bold text-pink-600">RM {todayRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{sales.length} transactions today</p>
            </motion.div>

            {/* Appointments Today */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-3">
                <div className="rounded-full p-2 bg-purple-100">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="ml-3 text-lg font-medium text-gray-700">Appointments Today</h2>
              </div>
              <p className="text-3xl font-bold text-purple-600">{todayAppointments.length}</p>
              <p className="text-sm text-gray-500 mt-1">
                {todayAppointments.length === 0 ? 'No appointments scheduled' : 
                 todayAppointments.length === 1 ? '1 client expected' : 
                 `${todayAppointments.length} clients expected`}
              </p>
            </motion.div>
          </div>

          {/* Today's Appointments */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-800">Today's Appointments</h2>
              <button 
                onClick={() => router.push('/appointments')}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
              >
                New Appointment
              </button>
            </div>
            
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">No appointments today</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your schedule is clear for today. Consider creating a new appointment or checking tomorrow's schedule.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 font-medium text-gray-600 text-sm">Time</th>
                      <th className="pb-3 font-medium text-gray-600 text-sm">Customer</th>
                      <th className="pb-3 font-medium text-gray-600 text-sm">Services</th>
                      <th className="pb-3 font-medium text-gray-600 text-sm">Price</th>
                      <th className="pb-3 font-medium text-gray-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.map((appointment) => (
                      <motion.tr 
                        key={appointment.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: 'rgba(249, 168, 212, 0.1)' }}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-4 text-gray-800">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            {appointment.time}
                          </div>
                        </td>
                        <td className="py-4 text-gray-800">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            {appointment.customer_name}
                          </div>
                        </td>
                        <td className="py-4 text-gray-800">
                          <div className="flex flex-wrap gap-1">
                            {appointment.services.map((service, index) => (
                              <span 
                                key={index} 
                                className="inline-flex text-xs font-medium bg-purple-100 text-purple-800 rounded-full px-2 py-1"
                              >
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-gray-800">
                          RM {appointment.total_price.toFixed(2)}
                        </td>
                        <td className="py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMarkAsDone(appointment, dayjs())}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center text-sm"
                            >
                              <BadgeCheck className="w-4 h-4 mr-1" />
                              Complete
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Calendar and Future Appointments Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Calendar</h2>
              {hydrated && (
                <div className="w-full">
                  <Calendar
                    date={calendarDate}
                    onChange={(date: Date) => {
                      setCalendarDate(date);
                      setSelectedDate(date);
                    }}
                    color="#be185d"
                    showDateDisplay={false}
                    dayContentRenderer={customDayContent}
                    className="custom-calendar"
                  />
                  <style jsx global>{`
                    .custom-calendar .rdrMonth {
                      width: 100%;
                    }
                    .custom-calendar .rdrDay {
                      height: 40px;
                    }
                    .custom-calendar .rdrDayToday .rdrDayNumber span:after {
                      background: #be185d;
                    }
                  `}</style>
                </div>
              )}
            </motion.div>

            {/* Selected Day Appointments */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="text-pink-600">{dayjs(selectedDate).format('MMM D')}</span>
                  {' '}Appointments
                </h2>
                <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {selectedAppointments.length} {selectedAppointments.length === 1 ? 'appointment' : 'appointments'}
                </span>
              </div>

              {selectedAppointments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg">
                  <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No appointments scheduled for this day.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 border border-gray-100 rounded-lg hover:border-pink-200 hover:bg-pink-50 transition-colors"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">{appointment.time}</span>
                        <span className="text-sm bg-pink-100 text-pink-800 px-2 py-0.5 rounded">
                          {appointment.total_duration} min
                        </span>
                      </div>
                      <div className="flex items-start">
                        <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800">{appointment.customer_name}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.services.map(s => s.name).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          RM {appointment.total_price.toFixed(2)}
                        </span>
                        {dayjs(selectedDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') && (
                          <button
                            onClick={() => handleMarkAsDone(appointment, dayjs())}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}