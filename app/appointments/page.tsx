'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  customer_name: string;
  service: string;
  staff?: string; // Make staff optional
  date: string;
  time: string;
}

export default function AppointmentPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    service: '',
    staff: '',
    date: '',
    time: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
    return () => {
      // Cleanup
      setFormData({ customer_name: '', service: '', staff: '', date: '', time: '' });
      setEditingId(null);
      setError(null);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw new Error(error.message);
      }

      setAppointments(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { customer_name, service, staff, date, time } = formData;

      // Validate required fields
      if (!customer_name || !service || !date || !time) {
        setError('Customer name, service, date and time are required');
        return;
      }

      const appointmentData = {
        customer_name,
        service,
        date,
        time,
        ...(staff ? { staff } : {}) // Only include staff if it exists
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingId);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([appointmentData]);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(insertError.message);
        }
      }

      // Reset form
      setFormData({ customer_name: '', service: '', staff: '', date: '', time: '' });
      setEditingId(null);
      await fetchAppointments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
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
        service: appointment.service || '',
        staff: appointment.staff || '',
        date: appointment.date || '',
        time: appointment.time || ''
      });
      setEditingId(appointment.id);
    } catch (err) {
      setError('Failed to load appointment data');
      console.error('Edit error:', err);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ customer_name: '', service: '', staff: '', date: '', time: '' });
    setEditingId(null);
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
              name="service"
              placeholder="Service"
              value={formData.service}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
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
          <div className="flex gap-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
              disabled={isSubmitting}
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
                  <th className="p-3 text-left text-gray-900">Service</th>
                  <th className="p-3 text-left text-gray-900">Date</th>
                  <th className="p-3 text-left text-gray-900">Time</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{appt.customer_name}</td>
                    <td className="p-3 text-gray-700">{appt.service}</td>
                    <td className="p-3 text-gray-700">{appt.date}</td>
                    <td className="p-3 text-gray-700">{appt.time}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleEdit(appt)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
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
