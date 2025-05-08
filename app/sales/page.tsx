// File: app/sales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

interface Sale {
  id: string;
  customer_name: string;
  service: string;
  amount: number;
  date: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    service: '',
    amount: '',
    date: new Date().toISOString().split('T')[0], // Set today as default
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw new Error(fetchError.message);
      setSales(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
      console.error('Error fetching sales:', err);
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
      const { customer_name, service, amount, date } = formData;
      
      // Validation
      if (!customer_name || !service || !amount || !date) {
        throw new Error('All fields are required');
      }

      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { error: insertError } = await supabase
        .from('sales')
        .insert([{ 
          customer_name, 
          service, 
          amount: amountNumber, 
          date 
        }]);

      if (insertError) throw new Error(insertError.message);

      // Reset form on success
      setFormData({
        customer_name: '',
        service: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });
      
      await fetchSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add sale');
      console.error('Sale insertion error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todaySales = sales
    .filter(sale => new Date(sale.date).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Sales</h1>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              className="p-2 border rounded w-full text-gray-900 placeholder-gray-500"
              disabled={isSubmitting}
            />
            <input
              type="number"
              name="amount"
              placeholder="Amount (RM)"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="p-2 border rounded w-full text-gray-900 placeholder-gray-500"
              disabled={isSubmitting}
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full text-gray-900"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <button 
              type="submit" 
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Sale'}
            </button>
            
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Today&apos;s Sales</h2>
            <p className="text-2xl text-pink-600">RM {todaySales.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-gray-900">Service</th>
                <th className="p-3 text-left text-gray-900">Amount</th>
                <th className="p-3 text-left text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-700">{sale.service}</td>
                  <td className="p-3 text-gray-700">RM {sale.amount.toFixed(2)}</td>
                  <td className="p-3 text-gray-700">{formatDate(sale.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
