import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { IncomeTransaction } from '@/lib/types';
import { saveIncomeTransaction } from '@/lib/storage';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { unformatCurrency, formatCurrency } from '@/lib/formatter';

interface BOSPModalProps {
  initialData?: IncomeTransaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BOSPModal({
  initialData,
  onClose,
  onSuccess,
}: BOSPModalProps) {
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount) {
      setError('Jumlah harus diisi');
      return;
    }

    const numAmount = unformatCurrency(amount);

    if (numAmount <= 0) {
      setError('Jumlah tidak valid');
      return;
    }

    setLoading(true);

    try {
      const month = date.substring(0, 7);
      const id = initialData?.id || Math.random().toString(36).substring(2, 11);

      await saveIncomeTransaction({
        id,
        studentId: undefined as any,
        category: 'Dana BOSP',
        amount: numAmount,
        month,
        date,
        description,
        status: 'completed',
      });

      onSuccess();
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Dana BOSP' : 'Tambah Dana BOSP'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none cursor-pointer"
                style={{ colorScheme: 'light' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah (Rp)
              </label>
              <CurrencyInput
                value={amount}
                onValueChange={setAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg font-bold text-green-600"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan (Opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Contoh: Pencairan tahap 1"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
