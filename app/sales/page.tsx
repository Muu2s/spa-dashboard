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

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '',
    service: '',
    amount: '',
    date: '',
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) console.error('Error fetching sales:', error);
    else setSales(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { customer_name, service, amount, date } = formData;
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) return alert('Invalid amount');

    const { error } = await supabase.from('sales').insert([{ customer_name, service, amount: amountNumber, date }]);
    if (error) console.error('Insert error:', error);
    else {
      setFormData({ customer_name: '', service: '', amount: '', date: '' });
      fetchSales();
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Sales</h1>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="customer_name"
              placeholder="Customer Name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
            <input
              type="text"
              name="service"
              placeholder="Service"
              value={formData.service}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
            <input
              type="number"
              name="amount"
              placeholder="Amount (RM)"
              value={formData.amount}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="p-2 border rounded w-full"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded">Add Sale</button>
        </form>

        {loading ? (
          <p>Loading sales...</p>
        ) : sales.length === 0 ? (
          <p>No sales recorded.</p>
        ) : (
          <table className="w-full bg-white shadow-sm rounded">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Customer</th>
                <th className="p-3">Service</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{sale.customer_name}</td>
                  <td className="p-3">{sale.service}</td>
                  <td className="p-3">RM {sale.amount.toFixed(2)}</td>
                  <td className="p-3">{sale.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
