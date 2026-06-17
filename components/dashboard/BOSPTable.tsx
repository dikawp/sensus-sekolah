import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllExpenseTransactions } from '@/lib/storage';
import { ExpenseTransaction } from '@/lib/types';
import { formatCurrency } from '@/lib/dashboardUtils';

interface BOSPTableProps {
  bossRemaining: number;
}

export default function BOSPTable({ bossRemaining }: BOSPTableProps) {
  const [bospExpenses, setBospExpenses] = useState<ExpenseTransaction[]>([]);

  useEffect(() => {
    getAllExpenseTransactions().then(transactions => {
      setBospExpenses(transactions.filter(
        (t) => t.fundSource === 'bosp'
      ));
    });
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Rincian Dana BOSP</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th colSpan={3} className="px-4 py-3 font-semibold text-center text-gray-900 border-r border-gray-200">
                  Sisa Dana BOSP
                </th>
                <th className="px-4 py-3 font-semibold text-right text-green-700 whitespace-nowrap">
                  {formatCurrency(bossRemaining)}
                </th>
              </tr>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-4 py-2 font-medium text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  Tanggal
                </th>
                <th className="px-4 py-2 font-medium text-gray-700 border-r border-gray-200 min-w-[150px]">
                  Kategori
                </th>
                <th className="px-4 py-2 font-medium text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  Jumlah
                </th>
                <th className="px-4 py-2 font-medium text-gray-700 min-w-[150px]">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bospExpenses.length === 0 ? (
                <tr>
                  <td className="px-4 py-2 text-gray-500 border-r border-gray-200">-</td>
                  <td className="px-4 py-2 text-gray-500 border-r border-gray-200">-</td>
                  <td className="px-4 py-2 text-gray-500 border-r border-gray-200">-</td>
                  <td className="px-4 py-2 text-gray-500">-</td>
                </tr>
              ) : (
                bospExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="px-4 py-2 text-gray-900 border-r border-gray-200">
                      {expense.category}
                    </td>
                    <td className="px-4 py-2 text-red-600 font-medium border-r border-gray-200 text-right whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {expense.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
