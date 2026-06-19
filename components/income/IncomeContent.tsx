'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllStudents, getIncomeByMonth, deleteIncomeTransaction, getAllCategories, getAllIncomeTransactions } from '@/lib/storage';
import { getArrearsByMonth, formatCurrency, getCurrentMonth, getMonthName } from '@/lib/dashboardUtils';
import { Student, IncomeTransaction, Category } from '@/lib/types';
import { useAcademicYear } from '@/lib/academicYearContext';
import { CheckCircle2, AlertCircle, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import TransactionModal from '@/components/modals/TransactionModal';
import ReceiptModal from '@/components/modals/ReceiptModal';

interface StudentWithPayment extends Student {
  isPaid: boolean;
  transaction?: IncomeTransaction;
}

export default function IncomeContent() {
  const [students, setStudents] = useState<StudentWithPayment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IncomeTransaction | null>(null);
  const [arrears, setArrears] = useState<any[]>([]);
  const [yearlyCategoryTotals, setYearlyCategoryTotals] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('other');
  const [otherIncomes, setOtherIncomes] = useState<IncomeTransaction[]>([]);
  const [transactionToEdit, setTransactionToEdit] = useState<IncomeTransaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { activeAcademicYear } = useAcademicYear();
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const fetchCats = async () => {
      const allCats = await getAllCategories();
      const cats = allCats.filter(c => c.type === 'income');
      setCategories(cats);
      const perStudentCats = cats.filter(c => c.isPerStudent);
      if (perStudentCats.length > 0 && activeTab === 'other') {
        setActiveTab(perStudentCats[0].name);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    const [allStudents, monthTransactions, allCats, arrearsData, allYearTransactions] = await Promise.all([
      getAllStudents(),
      getIncomeByMonth(currentMonth),
      getAllCategories(),
      getArrearsByMonth(currentMonth),
      getAllIncomeTransactions()
    ]);
    
    const activeStudents = allStudents.filter((s) => s.active);
    
    // Default fallback to "SPP" if not defined, but now activeTab represents the category name
    const targetCategory = activeTab !== 'other' ? activeTab : '';

    const catTransactions = monthTransactions.filter((t) => t.category === targetCategory);
    
    // Find non-per-student categories to show in "Lainnya"
    const perStudentCatNames = allCats.filter(c => c.isPerStudent).map(c => c.name);
    const nonSppTransactions = monthTransactions.filter((t) => !perStudentCatNames.includes(t.category) && t.category !== 'Dana BOSP');

    const studentsWithPayment = activeStudents.map((student) => {
      const transaction = catTransactions.find((t) => t.studentId === student.id);
      return {
        ...student,
        isPaid: !!transaction,
        transaction,
      };
    });

    const totals: Record<string, number> = {};
    const yearCategoryTrans = allYearTransactions.filter(t => t.category === targetCategory);
    for (const t of yearCategoryTrans) {
      if (t.studentId) {
        totals[t.studentId] = (totals[t.studentId] || 0) + t.amount;
      }
    }

    setStudents(studentsWithPayment);
    setOtherIncomes(nonSppTransactions);
    setArrears(arrearsData);
    setYearlyCategoryTotals(totals);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, currentMonth, categories]);

  const handleTransactionAdded = () => {
    loadData();
    setShowTransactionModal(false);
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

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const paidCount = students.filter((s) => s.isPaid).length;
  const totalIncome = students
    .filter((s) => s.isPaid)
    .reduce((sum, s) => sum + (s.transaction?.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pendapatan</h1>
          <p className="text-gray-600 mt-1">Pencatatan SPP dan sumber dana lainnya</p>
        </div>
        <button
          onClick={() => {
            setTransactionToEdit(null);
            setShowTransactionModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Transaksi
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pembayaran</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {paidCount}/{students.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">siswa sudah membayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Pemasukan</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-xs text-gray-500 mt-2">bulan {currentMonth.split('-')[1]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Tunggakan</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {arrears.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">siswa belum membayar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="relative border-b border-gray-200">
        <button
          onClick={() => scrollTabs('left')}
          className="absolute left-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-r from-white via-white to-transparent text-gray-400 hover:text-gray-800 transition sm:hidden flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 bg-white rounded-full shadow-sm" />
        </button>
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 sm:px-0">
          {categories.filter(c => c.isPerStudent).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.name)}
              className={`snap-start shrink-0 px-2 sm:px-4 py-3 font-medium whitespace-nowrap transition ${
                activeTab === cat.name
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Verifikasi {cat.name}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('other')}
            className={`snap-start shrink-0 px-2 sm:px-4 py-3 font-medium whitespace-nowrap transition ${
              activeTab === 'other'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pendapatan Lainnya
          </button>
        </div>
        <button
          onClick={() => scrollTabs('right')}
          className="absolute right-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-l from-white via-white to-transparent text-gray-400 hover:text-gray-800 transition sm:hidden flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 bg-white rounded-full shadow-sm" />
        </button>
      </div>

      {/* Content */}
      {activeTab !== 'other' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Siswa - Verifikasi {activeTab}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        {student.class} • {student.parentName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.isPaid ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          {student.transaction && (
                            <>
                              <button
                                onClick={() => {
                                  setTransactionToEdit(student.transaction!);
                                  setShowTransactionModal(true);
                                }}
                                className="text-xs p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Yakin ingin membatalkan/menghapus pembayaran ${activeTab} ini?`)) {
                                    await deleteIncomeTransaction(student.transaction!.id);
                                    loadData();
                                  }
                                }}
                                className="text-xs p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                                title="Batalkan Pembayaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTransaction(student.transaction!);
                                  setShowReceiptModal(true);
                                }}
                                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                              >
                                Lihat Kuitansi
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Pembayaran Panel */}
        {students.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 text-md">Total Pembayaran {activeTab}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {students.map((student) => {
                  const totalPaid = yearlyCategoryTotals[student.id] || 0;
                  return (
                    <div
                      key={student.id}
                      className="p-3 bg-white rounded-lg border border-green-200 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.class}</p>
                        </div>
                        <p className="text-sm font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pendapatan Lainnya</CardTitle>
          </CardHeader>
          <CardContent>
            {otherIncomes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada catatan pendapatan lainnya pada bulan ini.
              </div>
            ) : (
              <div className="space-y-3">
                {otherIncomes.map((income) => (
                  <div key={income.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="font-medium text-gray-900">{income.category}</p>
                      {income.description && <p className="text-sm text-gray-500">{income.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(income.date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-green-600">+{formatCurrency(income.amount)}</p>
                      <button
                        onClick={() => {
                          setTransactionToEdit(income);
                          setShowTransactionModal(true);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Yakin ingin menghapus transaksi ini?')) {
                            await deleteIncomeTransaction(income.id);
                            loadData();
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTransaction(income);
                          setShowReceiptModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition ml-2"
                      >
                        Lihat Kuitansi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showTransactionModal && (
        <TransactionModal
          month={currentMonth}
          initialData={transactionToEdit}
          onClose={() => {
            setShowTransactionModal(false);
            setTransactionToEdit(null);
          }}
          onSuccess={handleTransactionAdded}
        />
      )}

      {showReceiptModal && selectedTransaction && (
        <ReceiptModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}
