'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getExpenseByMonth,
  getAllBudgets,
  saveExpenseTransaction,
  getAllExpenseTransactions,
  deleteExpenseTransaction,
} from '@/lib/storage';
import {
  getBudgetStatus,
  formatCurrency,
  getCurrentMonth,
  getMonthName,
} from '@/lib/dashboardUtils';
import { BudgetAllocation, ExpenseTransaction } from '@/lib/types';
import { useAcademicYear } from '@/lib/academicYearContext';
import { AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import TransactionModal from '@/components/modals/TransactionModal';

export default function ExpensesContent() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<ExpenseTransaction | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | 'pendapatan' | 'bosp'>('all');
  const { activeAcademicYear } = useAcademicYear();

  const minMonth = activeAcademicYear?.startDate?.substring(0, 7) || '';
  const maxMonth = activeAcademicYear?.endDate?.substring(0, 7) || '';

  useEffect(() => {
    if (minMonth && maxMonth) {
      setCurrentMonth(prev => {
        if (prev < minMonth) return minMonth;
        if (prev > maxMonth) return maxMonth;
        return prev;
      });
    }
  }, [minMonth, maxMonth]);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    const [b, e] = await Promise.all([
      getAllBudgets(),
      getExpenseByMonth(currentMonth)
    ]);
    setBudgets(b);
    setExpenses(e);
  };

  const handleTransactionAdded = () => {
    loadData();
    setShowModal(false);
  };

  const getPrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    let prev = '';
    if (month === 1) prev = `${year - 1}-12`;
    else prev = `${year}-${String(month - 1).padStart(2, '0')}`;
    if (minMonth && prev < minMonth) return currentMonth;
    return prev;
  };

  const getNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    let next = '';
    if (month === 12) next = `${year + 1}-01`;
    else next = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (maxMonth && next > maxMonth) return currentMonth;
    return next;
  };

  const isPrevDisabled = minMonth ? currentMonth <= minMonth : false;
  const isNextDisabled = maxMonth ? currentMonth >= maxMonth : false;

  const totalBOSP = expenses.filter(e => e.fundSource === 'bosp').reduce((sum, e) => sum + e.amount, 0);
  const totalUmum = expenses.filter(e => e.fundSource !== 'bosp').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = totalBOSP + totalUmum;

  const filteredExpenses = filterSource === 'all' 
    ? expenses 
    : expenses.filter(e => filterSource === 'bosp' ? e.fundSource === 'bosp' : e.fundSource !== 'bosp');

  const categoryTotals = filteredExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Pengeluaran
          </h1>
          <p className="text-gray-600 mt-1">
            Pencatatan biaya operasional & monitoring anggaran
          </p>
        </div>
        <button
          onClick={() => {
            setTransactionToEdit(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Pengeluaran
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <button
          onClick={() => setCurrentMonth(getPrevMonth())}
          disabled={isPrevDisabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${isPrevDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <span>←</span> <span className="hidden sm:inline">Bulan Sebelumnya</span>
        </button>
        <input
          type="month"
          value={currentMonth}
          min={minMonth}
          max={maxMonth}
          onChange={(e) => {
            if (e.target.value) setCurrentMonth(e.target.value);
          }}
          className="px-4 py-2 outline-none text-gray-900 font-bold bg-transparent text-center cursor-pointer text-lg hover:bg-gray-50 rounded-lg transition min-w-[150px]"
          style={{ colorScheme: 'light' }}
        />
        <button
          onClick={() => setCurrentMonth(getNextMonth())}
          disabled={isNextDisabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${isNextDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <span className="hidden sm:inline">Bulan Berikutnya</span> <span>→</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalExpense)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{expenses.length} transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pengeluaran Umum</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalUmum)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{expenses.filter(e => e.fundSource !== 'bosp').length} transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pengeluaran Dana BOSP</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalBOSP)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{expenses.filter(e => e.fundSource === 'bosp').length} transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Summary */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Total Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{cat}</span>
                  <span className="font-bold text-red-600">{formatCurrency(total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Daftar Pengeluaran</CardTitle>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">Semua Sumber Dana</option>
            <option value="pendapatan">Dana Pendapatan (Umum)</option>
            <option value="bosp">Dana BOSP</option>
          </select>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada pengeluaran untuk kriteria ini
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {expense.category} • {expense.date} • Sumber:{' '}
                      <span className="font-medium">
                        {expense.fundSource === 'bosp' ? 'Dana BOSP' : 'Dana Pendapatan'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setTransactionToEdit(expense);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Yakin ingin menghapus pengeluaran ini?')) {
                            await deleteExpenseTransaction(expense.id);
                            loadData();
                          }
                        }}
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

      {/* Modal */}
      {showModal && (
        <TransactionModal
          month={currentMonth}
          isExpense={true}
          initialData={transactionToEdit}
          onClose={() => {
            setShowModal(false);
            setTransactionToEdit(null);
          }}
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  );
}
