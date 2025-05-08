// File: app/reports/page.tsx
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

interface Sale {
  id: string;
  customer_name: string;
  services: string;
  amount: number;
  date: string;
  staff?: string;
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
  status: 'pending' | 'completed';
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
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
      
    const { data: apptData, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false });

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
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;

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
              <p>Pending Appointments: <strong>{pendingAppointments}</strong></p>
              <p>Completed Appointments: <strong>{completedAppointments}</strong></p>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Recent Sales</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Customer</th>
                    <th className="p-2 text-left">Services</th>
                    <th className="p-2 text-left">Amount (RM)</th>
                    <th className="p-2 text-left">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 5).map(sale => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{sale.date}</td>
                      <td className="p-2">{sale.customer_name}</td>
                      <td className="p-2">{sale.services || '-'}</td>
                      <td className="p-2">{sale.amount.toFixed(2)}</td>
                      <td className="p-2">{sale.staff || '-'}</td>
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
                    <th className="p-2 text-left">Time</th>
                    <th className="p-2 text-left">Customer</th>
                    <th className="p-2 text-left">Services</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 5).map(appt => (
                    <tr key={appt.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{appt.date}</td>
                      <td className="p-2">{appt.time}</td>
                      <td className="p-2">{appt.customer_name}</td>
                      <td className="p-2">{appt.services.map(s => s.name).join(', ')}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                          appt.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appt.status === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-2">{appt.staff || '-'}</td>
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
