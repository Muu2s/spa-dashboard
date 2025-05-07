// File: app/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

interface Sale {
  id: string;
  date: string;
  amount: number;
  service: string;
}

interface Appointment {
  id: string;
  date: string;
  service: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: salesData, error: salesError } = await supabase.from('sales').select('*');
    const { data: apptData, error: apptError } = await supabase.from('appointments').select('*');

    if (salesError) console.error('Sales error:', salesError);
    else setSales(salesData || []);

    if (apptError) console.error('Appointments error:', apptError);
    else setAppointments(apptData || []);

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const appointmentCount = appointments.length;

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>

        {loading ? (
          <p>Loading report data...</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Summary</h2>
              <p>Total Sales: <strong>RM {totalSales.toFixed(2)}</strong></p>
              <p>Total Appointments: <strong>{appointmentCount}</strong></p>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Recent Sales</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Service</th>
                    <th className="p-2 text-left">Amount (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(-5).reverse().map(sale => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{sale.date}</td>
                      <td className="p-2">{sale.service}</td>
                      <td className="p-2">{sale.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Recent Appointments</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Service</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(-5).reverse().map(appt => (
                    <tr key={appt.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{appt.date}</td>
                      <td className="p-2">{appt.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
