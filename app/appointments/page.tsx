'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { 
  PencilSquareIcon, 
  TrashIcon, 
  CheckIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Appointment {
  id: string;
  customer_name: string;
  phone_number: string;
  services: Service[];
  staff?: string;
  date: string;
  time: string;
  total_duration: number;
  total_price: number;
}

export default function AppointmentPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    staff: '',
    date: '',
    time: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const checkAuth = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchAppointments();
    fetchServices();
    return () => {
      setFormData({ customer_name: '', phone_number: '', staff: '', date: '', time: '' });
      setSelectedServices([]);
      setEditingId(null);
      setError(null);
    };
  }, [checkAuth]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          phone_number,
          services,
          staff,
          date,
          time,
          total_duration,
          total_price
        `)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw new Error(error.message);
      }

      const formattedData = (data || []).map(appointment => ({
        ...appointment,
        services: appointment.services || []
      }));

      setAppointments(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const calculateTotals = (services: Service[]) => {
    return services.reduce(
      (acc, service) => ({
        duration: acc.duration + service.duration_minutes,
        price: acc.price + service.price,
      }),
      { duration: 0, price: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { customer_name, phone_number, staff, date, time } = formData;

      if (!customer_name || !date || !time || selectedServices.length === 0) {
        throw new Error('Customer name, services, date and time are required');
      }

      const { duration, price } = calculateTotals(selectedServices);

      const servicesData = selectedServices.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes
      }));

      const appointmentData = {
        customer_name,
        phone_number,
        services: servicesData,
        staff: staff || null,
        date,
        time,
        total_duration: duration,
        total_price: price
      };

      if (editingId) {
        const { data, error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingId)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      setFormData({ customer_name: '', phone_number: '', staff: '', date: '', time: '' });
      setSelectedServices([]);
      setEditingId(null);
      setShowForm(false);
      await fetchAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Appointment operation failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    try {
      setError(null);
      setFormData({
        customer_name: appointment.customer_name || '',
        phone_number: appointment.phone_number || '',
        staff: appointment.staff || '',
        date: appointment.date || '',
        time: appointment.time || ''
      });
      setSelectedServices(appointment.services || []);
      setEditingId(appointment.id);
      setShowForm(true);
    } catch (err) {
      setError('Failed to load appointment data');
    }
  };

  const handleCancelEdit = () => {
    setFormData({ customer_name: '', phone_number: '', staff: '', date: '', time: '' });
    setSelectedServices([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
    }
  };

  const handleMarkAsDone = async (appointment: Appointment) => {
    try {
      setError(null);

      const salesData = {
        customer_name: appointment.customer_name,
        service: appointment.services.map(s => s.name).join(', '),
        amount: appointment.total_price,
        date: new Date().toISOString().split('T')[0],
        staff: appointment.staff || null
      };

      const { data: saleData, error: salesError } = await supabase
        .from('sales')
        .insert([salesData])
        .select()
        .single();

      if (salesError) {
        throw new Error(`Failed to create sale: ${salesError.message}`);
      }

      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (deleteError) {
        throw new Error(`Failed to delete appointment: ${deleteError.message}`);
      }

      await fetchAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark appointment as done';
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTodaysDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-600">Manage your salon appointments efficiently</p>
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

        {/* Add Appointment Button */}
        {!showForm && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="mb-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Appointment
          </motion.button>
        )}

        {/* Appointment Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Appointment' : 'Create New Appointment'}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="customer_name"
                          placeholder="Enter customer name"
                          value={formData.customer_name}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          name="phone_number"
                          placeholder="Enter phone number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Staff Member
                      </label>
                      <input
                        type="text"
                        name="staff"
                        placeholder="Enter staff name"
                        value={formData.staff}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date *
                        </label>
                        <div className="relative">
                          <CalendarDaysIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={getTodaysDate()}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time *
                        </label>
                        <div className="relative">
                          <ClockIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Select Services *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.map(service => (
                        <motion.div
                          key={service.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleServiceToggle(service)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedServices.some(s => s.id === service.id)
                              ? 'border-pink-500 bg-pink-50 shadow-md'
                              : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{service.name}</h4>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="inline-flex items-center">
                                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                  RM {service.price.toFixed(2)}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="inline-flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {service.duration_minutes} mins
                                </span>
                              </div>
                            </div>
                            {selectedServices.some(s => s.id === service.id) && (
                              <CheckIcon className="h-6 w-6 text-pink-500" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Services Summary */}
                  {selectedServices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-4">Selected Services Summary</h4>
                      <div className="space-y-2">
                        {selectedServices.map(service => (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">{service.name}</span>
                            <span className="font-medium">RM {service.price.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-pink-200 pt-3 mt-3">
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total Duration:</span>
                            <span className="text-purple-600">{calculateTotals(selectedServices).duration} mins</span>
                          </div>
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total Price:</span>
                            <span className="text-pink-600">RM {calculateTotals(selectedServices).price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      disabled={isSubmitting || selectedServices.length === 0}
                    >
                      {isSubmitting 
                        ? (editingId ? 'Updating...' : 'Creating...') 
                        : (editingId ? 'Update Appointment' : 'Create Appointment')
                      }
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <CalendarDaysIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No appointments yet</h3>
            <p className="text-gray-500">Create your first appointment to get started</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
            {appointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{appointment.customer_name}</h3>
                    <p className="text-gray-600 flex items-center mt-1">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {appointment.phone_number}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMarkAsDone(appointment)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Mark as completed"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(appointment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit appointment"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(appointment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete appointment"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <CalendarDaysIcon className="h-5 w-5 text-pink-500 mr-3" />
                    <span className="font-medium">{formatDate(appointment.date)}</span>
                    <span className="mx-2">•</span>
                    <ClockIcon className="h-4 w-4 text-purple-500 mr-1" />
                    <span>{formatTime(appointment.time)}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <UserIcon className="h-5 w-5 text-blue-500 mr-3" />
                    <span>{appointment.staff || 'No staff assigned'}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Services</h4>
                    <div className="space-y-1">
                      {appointment.services.map((service, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{service.name}</span>
                          <span className="text-gray-600">RM {service.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">{appointment.total_duration} minutes</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-pink-600">
                        RM {appointment.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}