// File: app/sales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import dayjs from 'dayjs';

interface Sale {
  id: string;
  customer_name: string;
  service: string;
  amount: number;
  date: string;
  staff?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = dayjs().format('YYYY-MM-DD');

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
        .eq('date', today) // Only fetch today's sales
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

  const todaySales = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Today&apos;s Sales</h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Total Sales</h2>
            <p className="text-2xl text-pink-600">RM {todaySales.toFixed(2)}</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded shadow p-4">
            <p>Loading sales data...</p>
          </div>
        ) : (
          <div className="bg-white rounded shadow">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-gray-900">Time</th>
                  <th className="p-3 text-left text-gray-900">Customer</th>
                  <th className="p-3 text-left text-gray-900">Services</th>
                  <th className="p-3 text-left text-gray-900">Amount</th>
                  <th className="p-3 text-left text-gray-900">Staff</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">
                      No sales recorded today
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-700">{sale.date}</td>
                      <td className="p-3 text-gray-700">{sale.customer_name}</td>
                      <td className="p-3 text-gray-700">
                        {sale.service || '-'}
                      </td>
                      <td className="p-3 text-gray-700">RM {sale.amount.toFixed(2)}</td>
                      <td className="p-3 text-gray-700">{sale.staff || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
