// File: app/services/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: '' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (error) console.error('Error fetching services:', error);
    else setServices(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { name, price, duration_minutes } = formData;
      const priceNumber = parseFloat(price);
      const durationNumber = parseInt(duration_minutes);

      if (isNaN(priceNumber)) {
        setError('Please enter a valid price');
        return;
      }

      if (isNaN(durationNumber) || durationNumber <= 0) {
        setError('Please enter a valid duration');
        return;
      }

      const { error: supabaseError } = await supabase
        .from('services')
        .insert([{ 
          name, 
          price: priceNumber,
          duration_minutes: durationNumber 
        }]);

      if (supabaseError) {
        setError(supabaseError.message || 'Failed to create service');
      } else {
        setFormData({ name: '', price: '', duration_minutes: '' });
        await fetchServices();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Service creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Services</h1>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow-sm space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Service Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
            <input
              type="number"
              name="price"
              placeholder="Price (RM)"
              value={formData.price}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
            <input
              type="number"
              name="duration_minutes"
              placeholder="Duration (minutes)"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
          </div>
          <button 
            type="submit" 
            className="px-4 py-2 bg-pink-600 text-white rounded disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Service'}
          </button>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </form>

        {loading ? (
          <p>Loading services...</p>
        ) : services.length === 0 ? (
          <p>No services found.</p>
        ) : (
          <table className="w-full bg-white shadow-sm rounded">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Price (RM)</th>
                <th className="p-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{svc.name}</td>
                  <td className="p-3">RM {svc.price.toFixed(2)}</td>
                  <td className="p-3">{svc.duration_minutes} mins</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
