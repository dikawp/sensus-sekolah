'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAllIncomeTransactions,
  getAllExpenseTransactions,
  getAllStudents,
} from '@/lib/storage';
import { formatCurrency, getMonthName } from '@/lib/dashboardUtils';
import { Download, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useAcademicYear } from '@/lib/academicYearContext';
import { IncomeTransaction, ExpenseTransaction, Student } from '@/lib/types';

export default function ReportsContent() {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const { activeAcademicYear } = useAcademicYear();

  const [allIncomeRaw, setAllIncomeRaw] = useState<IncomeTransaction[]>([]);
  const [allExpenseRaw, setAllExpenseRaw] = useState<ExpenseTransaction[]>([]);
  const [allStudentsData, setAllStudentsData] = useState<Student[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [inc, exp, stu] = await Promise.all([
        getAllIncomeTransactions(),
        getAllExpenseTransactions(),
        getAllStudents()
      ]);
      setAllIncomeRaw(inc);
      setAllExpenseRaw(exp);
      setAllStudentsData(stu);
    };
    loadData();
  }, []);

  const incomeTransactions = allIncomeRaw.filter(
    (t) => (selectedMonth === 'all' || t.month === selectedMonth) && t.status === 'completed'
  );
  const expenseTransactions = allExpenseRaw.filter(
    (t) => selectedMonth === 'all' || t.month === selectedMonth
  );

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const allIncome = allIncomeRaw.filter(t => t.status === 'completed');
    const allExpense = allExpenseRaw;

    const isAllMonths = selectedMonth === 'all';
    const targetMonths = isAllMonths ? [...months].reverse() : [selectedMonth];
    const headerCols = isAllMonths ? [...targetMonths, 'Total'] : targetMonths;

    const periodName = isAllMonths 
      ? `Tahun Ajaran ${activeAcademicYear?.name || ''}` 
      : getMonthName(selectedMonth);

    // Calculate historical balance BEFORE the first target month
    let runningSaldo = 0;
    if (!isAllMonths && activeAcademicYear) {
      const startMonth = activeAcademicYear.startDate.substring(0, 7);
      const pastIncomes = allIncome.filter(t => t.month >= startMonth && t.month < selectedMonth);
      const pastExpenses = allExpense.filter(t => t.month >= startMonth && t.month < selectedMonth);
      runningSaldo = pastIncomes.reduce((s,t) => s+t.amount, 0) - pastExpenses.reduce((s,t) => s+t.amount, 0);
    }

    const applyTableStyle = (ws: any, rowCount: number, colCount: number) => {
      for (let R = 0; R < rowCount; ++R) {
        for (let C = 0; C < colCount; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          if (R === 0) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 14, color: { rgb: "000000" } }
            };
          } else if (R === 2) { // Header row
            ws[cellAddress].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "16A34A" } },
              border: {
                top: { style: 'thin', color: { auto: 1 } },
                bottom: { style: 'thin', color: { auto: 1 } },
                left: { style: 'thin', color: { auto: 1 } },
                right: { style: 'thin', color: { auto: 1 } },
              },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          } else if (R > 2) {
            ws[cellAddress].s = {
              border: {
                top: { style: 'thin', color: { auto: 1 } },
                bottom: { style: 'thin', color: { auto: 1 } },
                left: { style: 'thin', color: { auto: 1 } },
                right: { style: 'thin', color: { auto: 1 } },
              }
            };
            if (C === 0) {
               ws[cellAddress].s.font = { bold: true };
            } else if (typeof ws[cellAddress].v === 'number') {
               ws[cellAddress].z = '"Rp" #,##0;[Red]-"Rp" #,##0';
            }
          }
        }
      }
    };

    // --- SHEET 1: RINGKASAN ---
    const summaryData: any[][] = [
      [`RINGKASAN KEUANGAN: ${periodName}`],
      [],
      ['Kategori', ...headerCols.map(m => m === 'Total' ? m : getMonthName(m))],
    ];

    const rowSaldoAwal: any[] = ['Saldo Awal Bulan'];
    const rowPemasukan: any[] = ['Total Pemasukan (bulan ini)'];
    const rowPengeluaran: any[] = ['Total Pengeluaran (bulan ini)'];
    const rowSelisih: any[] = ['Selisih'];
    const rowSisa: any[] = ['Sisa saldo'];

    let tIncomeSum = 0;
    let tExpenseSum = 0;
    let tSelisihSum = 0;

    targetMonths.forEach(m => {
      rowSaldoAwal.push(runningSaldo);
      
      const mIncome = allIncome.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      const mExpense = allExpense.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      
      rowPemasukan.push(mIncome);
      tIncomeSum += mIncome;

      rowPengeluaran.push(mExpense);
      tExpenseSum += mExpense;
      
      const selisih = mIncome - mExpense;
      rowSelisih.push(selisih);
      tSelisihSum += selisih;
      
      runningSaldo += selisih;
      rowSisa.push(runningSaldo);
    });

    if (isAllMonths) {
      rowSaldoAwal.push('');
      rowPemasukan.push(tIncomeSum);
      rowPengeluaran.push(tExpenseSum);
      rowSelisih.push(tSelisihSum);
      rowSisa.push(runningSaldo); // Sisa akhir
    }

    summaryData.push(rowSaldoAwal, rowPemasukan, rowPengeluaran, rowSelisih, rowSisa);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 30 }, ...headerCols.map(() => ({ wch: 20 }))];
    applyTableStyle(summaryWs, summaryData.length, headerCols.length + 1);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

    // --- SHEET 2: PEMASUKAN UMUM ---
    const incomeData: any[][] = [
      [`LAPORAN PEMASUKAN UMUM: ${periodName}`],
      [],
      ['Kategori', ...headerCols.map(m => m === 'Total' ? m : getMonthName(m))],
    ];
    
    const targetIncome = allIncome.filter(t => targetMonths.includes(t.month) && t.category !== 'Dana BOSP');
    const incomeCats = Array.from(new Set(targetIncome.map(t => t.category)));
    
    incomeCats.forEach(cat => {
      const row: any[] = [cat];
      let catSum = 0;
      targetMonths.forEach(m => {
        const val = targetIncome.filter(t => t.category === cat && t.month === m).reduce((s, t) => s + t.amount, 0);
        row.push(val);
        catSum += val;
      });
      if (isAllMonths) row.push(catSum);
      incomeData.push(row);
    });
    
    incomeData.push([]);
    const totalIncomeRow: any[] = ['Total Pemasukan Umum'];
    let incomeTotalSum = 0;
    targetMonths.forEach(m => {
      const val = targetIncome.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      totalIncomeRow.push(val);
      incomeTotalSum += val;
    });
    if (isAllMonths) totalIncomeRow.push(incomeTotalSum);
    incomeData.push(totalIncomeRow);

    const incomeWs = XLSX.utils.aoa_to_sheet(incomeData);
    incomeWs['!cols'] = [{ wch: 30 }, ...headerCols.map(() => ({ wch: 20 }))];
    applyTableStyle(incomeWs, incomeData.length, headerCols.length + 1);
    XLSX.utils.book_append_sheet(wb, incomeWs, 'Pemasukan Umum');

    // --- SHEET 3: PENGELUARAN (Umum) ---
    const expenseData: any[][] = [
      [`LAPORAN PENGELUARAN UMUM: ${periodName}`],
      [],
      ['Kategori', ...headerCols.map(m => m === 'Total' ? m : getMonthName(m))],
    ];
    
    const targetExpense = allExpense.filter(t => targetMonths.includes(t.month) && t.fundSource !== 'bosp');
    const expenseCats = Array.from(new Set(targetExpense.map(t => t.category)));
    
    expenseCats.forEach(cat => {
      const row: any[] = [cat];
      let catSum = 0;
      targetMonths.forEach(m => {
        const val = targetExpense.filter(t => t.category === cat && t.month === m).reduce((s, t) => s + t.amount, 0);
        row.push(val);
        catSum += val;
      });
      if (isAllMonths) row.push(catSum);
      expenseData.push(row);
    });
    
    expenseData.push([]);
    const totalExpenseRow: any[] = ['Total Pengeluaran Umum'];
    let expenseTotalSum = 0;
    targetMonths.forEach(m => {
      const val = targetExpense.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      totalExpenseRow.push(val);
      expenseTotalSum += val;
    });
    if (isAllMonths) totalExpenseRow.push(expenseTotalSum);
    expenseData.push(totalExpenseRow);

    const expenseWs = XLSX.utils.aoa_to_sheet(expenseData);
    expenseWs['!cols'] = [{ wch: 30 }, ...headerCols.map(() => ({ wch: 20 }))];
    applyTableStyle(expenseWs, expenseData.length, headerCols.length + 1);
    XLSX.utils.book_append_sheet(wb, expenseWs, 'Pengeluaran');

    // --- SHEET 4: RINCIAN DANA BOSP ---
    const bospData: any[][] = [
      [`RINCIAN DANA BOSP: ${periodName}`],
      [],
      ['Kategori', ...headerCols.map(m => m === 'Total' ? m : getMonthName(m))],
    ];
    
    const targetBospIncome = allIncome.filter(t => targetMonths.includes(t.month) && t.category === 'Dana BOSP');
    const targetBospExpense = allExpense.filter(t => targetMonths.includes(t.month) && t.fundSource === 'bosp');
    
    // Pemasukan Row
    const rowBospIncome: any[] = ['Pemasukan BOSP'];
    let bospIncomeSum = 0;
    targetMonths.forEach(m => {
      const val = targetBospIncome.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      rowBospIncome.push(val);
      bospIncomeSum += val;
    });
    if (isAllMonths) rowBospIncome.push(bospIncomeSum);
    bospData.push(rowBospIncome);

    // Pengeluaran Rows
    const bospCats = Array.from(new Set(targetBospExpense.map(t => t.category)));
    bospCats.forEach(cat => {
      const row: any[] = [`Pengeluaran - ${cat}`];
      let catSum = 0;
      targetMonths.forEach(m => {
        // Use negative amount for pengeluaran
        const val = -targetBospExpense.filter(t => t.category === cat && t.month === m).reduce((s, t) => s + t.amount, 0);
        row.push(val);
        catSum += val;
      });
      if (isAllMonths) row.push(catSum);
      bospData.push(row);
    });
    
    bospData.push([]);
    const totalBospRow: any[] = ['Sisa/Selisih Dana BOSP'];
    let bospTotalSum = 0;
    targetMonths.forEach(m => {
      const inc = targetBospIncome.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      const exp = targetBospExpense.filter(t => t.month === m).reduce((s, t) => s + t.amount, 0);
      const val = inc - exp;
      totalBospRow.push(val);
      bospTotalSum += val;
    });
    if (isAllMonths) totalBospRow.push(bospTotalSum);
    bospData.push(totalBospRow);

    const bospWs = XLSX.utils.aoa_to_sheet(bospData);
    bospWs['!cols'] = [{ wch: 40 }, ...headerCols.map(() => ({ wch: 20 }))];
    applyTableStyle(bospWs, bospData.length, headerCols.length + 1);
    XLSX.utils.book_append_sheet(wb, bospWs, 'Rincian Dana BOSP');

    // Save file
    const fileName = isAllMonths 
      ? `Laporan_Keuangan_TA_${activeAcademicYear?.name?.replace(/[^a-z0-9]/gi, '_')}.xlsx`
      : `Laporan_Keuangan_${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const months = useMemo(() => {
    if (!activeAcademicYear) {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      });
    }

    const start = new Date(activeAcademicYear.startDate);
    const end = new Date(activeAcademicYear.endDate);
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    
    const result: string[] = [];
    while (current <= last) {
      result.unshift(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [activeAcademicYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-600 mt-1">
          Rekapitulasi pemasukan dan pengeluaran untuk keperluan administratif
        </p>
      </div>

      {/* Month Selector & Export Button */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Bulan
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
          >
            <option value="all">Semua Bulan (Tahun Ajaran Aktif)</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-6">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Download className="w-5 h-5" />
            Export ke Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Pemasukan</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {incomeTransactions.length} transaksi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatCurrency(totalExpense)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {expenseTransactions.length} transaksi
            </p>
          </CardContent>
        </Card>
        <Card
          className={
            totalIncome >= totalExpense ? 'border-green-200' : 'border-red-200'
          }
        >
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Selisih (Saldo)</p>
            <p
              className={`text-3xl font-bold mt-2 ${totalIncome >= totalExpense ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {formatCurrency(totalIncome - totalExpense)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {totalIncome >= totalExpense ? 'Surplus' : 'Defisit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Laporan Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada data pemasukan
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incomeTransactions.map((t) => {
                  const student = t.studentId
                    ? allStudentsData.find((s) => s.id === t.studentId)
                    : null;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {student?.name || 'Bulk - ' + t.category}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {t.date} • {t.category}
                        </p>
                      </div>
                      <p className="font-bold text-green-700">
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Laporan Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada data pengeluaran
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expenseTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {t.description}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {t.date} • {t.category} {t.vendor ? `• ${t.vendor}` : ''}
                      </p>
                    </div>
                    <p className="font-bold text-red-700">
                      {formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
