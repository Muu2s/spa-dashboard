'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

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

export default function AppointmentPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    staff: '',
    date: '',
    time: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Cleanup
      setFormData({ customer_name: '', staff: '', date: '', time: '' });
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

      // Ensure services is always an array
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
      const { customer_name, staff, date, time } = formData;

      // Validate required fields
      if (!customer_name || !date || !time || selectedServices.length === 0) {
        throw new Error('Customer name, services, date and time are required');
      }

      const { duration, price } = calculateTotals(selectedServices);

      // Prepare the services data for storage
      const servicesData = selectedServices.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes
      }));

      const appointmentData = {
        customer_name,
        services: servicesData,
        staff: staff || null,
        date,
        time,
        total_duration: duration,
        total_price: price
      };

      console.log('Submitting appointment data:', appointmentData);

      if (editingId) {
        const { data, error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingId)
          .select()
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(updateError.message);
        }

        if (!data) {
          throw new Error('Failed to update appointment');
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(insertError.message);
        }

        if (!data) {
          throw new Error('Failed to create appointment');
        }
      }

      // Reset form on success
      setFormData({ customer_name: '', staff: '', date: '', time: '' });
      setSelectedServices([]);
      setEditingId(null);
      await fetchAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Appointment operation failed: ${errorMessage}`);
      console.error('Appointment operation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    try {
      setError(null);
      setFormData({
        customer_name: appointment.customer_name || '',
        staff: appointment.staff || '',
        date: appointment.date || '',
        time: appointment.time || ''
      });
      setSelectedServices(appointment.services || []);
      setEditingId(appointment.id);
    } catch (err) {
      setError('Failed to load appointment data');
      console.error('Edit error:', err);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ customer_name: '', staff: '', date: '', time: '' });
    setSelectedServices([]);
    setEditingId(null);
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
      console.error('Delete error:', err);
    }
  };

  const handleMarkAsDone = async (appointment: Appointment) => {
    try {
      setError(null);

      // Create sales record
      const salesData = {
        customer_name: appointment.customer_name,
        service: appointment.services.map(s => s.name).join(', '), // Convert services array to comma-separated string
        amount: appointment.total_price,
        date: new Date().toISOString().split('T')[0],
        staff: appointment.staff || null
      };

      console.log('Creating sale with data:', salesData);

      const { data: saleData, error: salesError } = await supabase
        .from('sales')
        .insert([salesData])
        .select()
        .single();

      if (salesError) {
        console.error('Sales creation error:', salesError);
        throw new Error(`Failed to create sale: ${salesError.message}`);
      }

      console.log('Sale created successfully:', saleData);

      // Delete the appointment after creating the sale
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (deleteError) {
        console.error('Appointment deletion error:', deleteError);
        throw new Error(`Failed to delete appointment: ${deleteError.message}`);
      }

      console.log('Appointment deleted successfully');

      // Refresh appointments list
      await fetchAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark appointment as done';
      setError(errorMessage);
      console.error('Mark as done error:', err);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Appointments</h1>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="customer_name"
              placeholder="Customer Name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full text-gray-900 placeholder-gray-500"
              disabled={isSubmitting}
            />
            <input
              type="text"
              name="staff"
              placeholder="Staff"
              value={formData.staff}
              onChange={handleChange}
              className="p-2 border rounded w-full"
              disabled={isSubmitting}
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
              disabled={isSubmitting}
            />
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
              disabled={isSubmitting}
            />
          </div>

          <div className="service-selection mt-4">
            <h3 className="text-lg font-semibold mb-2">Select Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => handleServiceToggle(service)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedServices.some(s => s.id === service.id)
                      ? 'bg-pink-50 border-pink-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-600">
                    <span>RM {service.price.toFixed(2)}</span>
                    <span className="mx-2">•</span>
                    <span>{service.duration_minutes} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedServices.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium">Selected Services Summary</h4>
              <div className="mt-2 space-y-1">
                {selectedServices.map(service => (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span>{service.name}</span>
                    <span>RM {service.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-medium">
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span>{calculateTotals(selectedServices).duration} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Price:</span>
                    <span>RM {calculateTotals(selectedServices).price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
              disabled={isSubmitting || selectedServices.length === 0}
            >
              {isSubmitting 
                ? (editingId ? 'Updating...' : 'Adding...') 
                : (editingId ? 'Update Appointment' : 'Add Appointment')
              }
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p>No appointments recorded.</p>
        ) : (
          <div className="bg-white rounded shadow">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-gray-900">Customer</th>
                  <th className="p-3 text-left text-gray-900">Services</th>
                  <th className="p-3 text-left text-gray-900">Total</th>
                  <th className="p-3 text-left text-gray-900">Duration</th>
                  <th className="p-3 text-left text-gray-900">Date</th>
                  <th className="p-3 text-left text-gray-900">Time</th>
                  <th className="p-3 text-left text-gray-900">Staff</th>
                  <th className="p-3 text-left text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{appt.customer_name}</td>
                    <td className="p-3 text-gray-700">
                      {appt.services.map(s => s.name).join(', ')}
                    </td>
                    <td className="p-3 text-gray-700">RM {appt.total_price.toFixed(2)}</td>
                    <td className="p-3 text-gray-700">{appt.total_duration} mins</td>
                    <td className="p-3 text-gray-700">{appt.date}</td>
                    <td className="p-3 text-gray-700">{appt.time}</td>
                    <td className="p-3 text-gray-700">{appt.staff || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(appt)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
