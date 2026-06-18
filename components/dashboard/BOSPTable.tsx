import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllExpenseTransactions, getAllIncomeTransactions } from '@/lib/storage';
import { formatCurrency } from '@/lib/dashboardUtils';
import { DataTable, Column } from '@/components/ui/DataTable';

interface BOSPTableProps {
  bossRemaining: number;
}

type BOSPTransaction = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  type: 'income' | 'expense';
};

export default function BOSPTable({ bossRemaining }: BOSPTableProps) {
  const [bospTransactions, setBospTransactions] = useState<BOSPTransaction[]>([]);

  useEffect(() => {
    Promise.all([
      getAllExpenseTransactions(),
      getAllIncomeTransactions()
    ]).then(([expenses, incomes]) => {
      const bospExp: BOSPTransaction[] = expenses
        .filter(t => t.fundSource === 'bosp')
        .map(t => ({
          id: t.id,
          date: t.date,
          category: t.category,
          amount: t.amount,
          description: t.description,
          type: 'expense'
        }));
      
      const bospInc: BOSPTransaction[] = incomes
        .filter(t => t.category === 'Dana BOSP' && t.status === 'completed')
        .map(t => ({
          id: t.id,
          date: t.date,
          category: t.category,
          amount: t.amount,
          description: t.description,
          type: 'income'
        }));

      const combined = [...bospExp, ...bospInc].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setBospTransactions(combined);
    });
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Rincian BOSP</CardTitle>
        <div className="text-sm font-semibold text-gray-900">
          Sisa Dana: <span className="text-green-700">{formatCurrency(bossRemaining)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <DataTable
          columns={[
            { header: 'Tanggal', accessor: 'date', sortable: true, hideOnMobile: true },
            { 
              header: 'Tipe', 
              accessor: 'type', 
              sortable: true,
              hideOnMobile: true,
              cell: (transaction) => (
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              )
            },
            { header: 'Kategori', accessor: 'category', sortable: true },
            { 
              header: 'Jumlah', 
              accessor: 'amount',
              sortable: true,
              cell: (transaction) => (
                <span className={`font-medium whitespace-nowrap ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              )
            },
            { 
              header: 'Keterangan', 
              accessor: 'description',
              hideOnMobile: true,
              cell: (transaction) => transaction.description || '-'
            }
          ]}
          data={bospTransactions}
          keyField="id"
          pagination={true}
          rowsPerPage={5}
          emptyMessage="Belum ada rincian dana BOSP"
        />
      </CardContent>
    </Card>
  );
}
