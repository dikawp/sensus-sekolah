import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAllIncomeTransactions,
  deleteIncomeTransaction,
} from '@/lib/storage';
import { IncomeTransaction } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatter';
import BOSPModal from '../modals/BOSPModal';

export default function BOSPManagement() {
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<IncomeTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allIncomes = await getAllIncomeTransactions();
    setTransactions(allIncomes.filter(
      (t) => t.category === 'Dana BOSP'
    ));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus riwayat dana BOSP ini?')) {
      await deleteIncomeTransaction(id);
      loadData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Manajemen Dana BOSP</h2>
        <button
          onClick={() => {
            setTransactionToEdit(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Dana BOSP
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemasukan Dana BOSP</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada catatan dana BOSP
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Dana BOSP
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {transaction.date} {transaction.description ? `• ${transaction.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <p className="font-bold text-green-600">
                      +{formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setTransactionToEdit(transaction);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <BOSPModal
          initialData={transactionToEdit}
          onClose={() => {
            setShowModal(false);
            setTransactionToEdit(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setTransactionToEdit(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
