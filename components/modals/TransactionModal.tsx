'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  getAllStudents,
  saveIncomeTransaction,
  saveExpenseTransaction,
  getAllExpenseTransactions,
  getAllIncomeTransactions,
  getAllCategories,
} from '@/lib/storage';
import { Category } from '@/lib/types';
import { X } from 'lucide-react';
import { unformatCurrency } from '@/lib/formatter';
import CurrencyInput from '@/components/ui/CurrencyInput';

interface TransactionModalProps {
  month: string;
  onClose: () => void;
  onSuccess: () => void;
  isExpense?: boolean;
  initialData?: any;
}

export default function TransactionModal({
  month,
  onClose,
  onSuccess,
  isExpense = false,
  initialData,
}: TransactionModalProps) {
  const isInitialExpense = initialData ? !('status' in initialData) : isExpense;
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<'income' | 'expense'>(isInitialExpense ? 'expense' : 'income');
  const [studentId, setStudentId] = useState(initialData?.studentId || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [fundSource, setFundSource] = useState<'pendapatan' | 'bosp'>(initialData?.fundSource || 'pendapatan');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allIncomes, setAllIncomes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [cats, stus, incs] = await Promise.all([
        getAllCategories(),
        getAllStudents(),
        getAllIncomeTransactions()
      ]);
      setCategories(cats);
      setAllStudents(stus.filter(s => s.active));
      setAllIncomes(incs);

      if (!initialData?.category) {
        const typeCats = cats.filter(c => c.type === (isInitialExpense ? 'expense' : 'income'));
        if (typeCats.length > 0) {
          setCategory(typeCats[0].name);
        }
      }
    };
    fetchData();
  }, [isInitialExpense, initialData?.category]);

  const targetMonth = initialData?.month || month;
  const paidStudentIds = new Set(
    allIncomes
      .filter(t => t.month === targetMonth && t.category === category)
      .map(t => t.studentId)
  );

  const availableStudents = allStudents.filter(
    (s) => !paidStudentIds.has(s.id) || s.id === initialData?.studentId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = unformatCurrency(amount);
    if (!amount || numAmount <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }

    const selectedCat = categories.find(c => c.name === category && c.type === type);
    if (type === 'income' && selectedCat?.isPerStudent) {
      if (!studentId) {
        setError('Pilih siswa terlebih dahulu');
        return;
      }
      if (!availableStudents.find(s => s.id === studentId)) {
        setError('Siswa sudah melakukan pembayaran untuk kategori ini di bulan yang sama');
        return;
      }
    }

    setLoading(true);

    try {
      if (type === 'income') {
        const id = initialData?.id || Math.random().toString(36).substring(2, 11);
        await saveIncomeTransaction({
          id,
          studentId,
          category,
          amount: numAmount,
          month: targetMonth,
          date: initialData?.date || new Date().toISOString().split('T')[0],
          status: 'completed',
          description,
        });
      } else {
        const id = initialData?.id || Math.random().toString(36).substring(2, 11);
        await saveExpenseTransaction({
          id,
          category,
          amount: numAmount,
          month: targetMonth,
          date: initialData?.date || new Date().toISOString().split('T')[0],
          description,
          fundSource,
        });
      }

      onSuccess();
    } catch (err) {
      setError('Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!initialData}
                onClick={() => setType('income')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  type === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                } ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                disabled={!!initialData}
                onClick={() => setType('expense')}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  type === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                } ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Pengeluaran
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                {categories.filter(c => c.type === type).map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Fund Source (Expense only) */}
            {type === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sumber Dana
                </label>
                <select
                  value={fundSource}
                  onChange={(e) => setFundSource(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="pendapatan">Dana Pendapatan (Umum)</option>
                  <option value="bosp">Dana BOSP</option>
                </select>
              </div>
            )}

            {/* Student Select (Income only) */}
            {type === 'income' && categories.find(c => c.name === category)?.isPerStudent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Siswa
                </label>
                <select
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.class})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah (Rp)
              </label>
              <CurrencyInput
                value={amount}
                onValueChange={setAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="100.000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {amount ? `Rp ${amount}` : 'Rp 0'}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Masukkan keterangan transaksi"
                rows={2}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
