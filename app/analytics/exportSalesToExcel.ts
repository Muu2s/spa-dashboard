import { utils, writeFile } from 'xlsx';
import dayjs from 'dayjs';
import { Sale } from './page';

export function exportSalesToExcel(sales: Sale[], period: 'weekly' | 'monthly') {
  let filteredSales: Sale[] = [];
  const today = dayjs();
  if (period === 'weekly') {
    const startOfWeek = today.startOf('week');
    filteredSales = sales.filter(sale => dayjs(sale.date).isSameOrAfter(startOfWeek));
  } else if (period === 'monthly') {
    const startOfMonth = today.startOf('month');
    filteredSales = sales.filter(sale => dayjs(sale.date).isSameOrAfter(startOfMonth));
  }

  const worksheet = utils.json_to_sheet(filteredSales);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sales');
  const filename = `sales-report-${period}-${today.format('YYYY-MM-DD')}.xlsx`;
  writeFile(workbook, filename);
}
