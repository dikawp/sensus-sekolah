'use client';

import { useEffect, useState } from 'react';
import {
  getFinancialSummary,
  getMonthlyTrends,
  formatCurrency,
  getCurrentMonth,
} from '@/lib/dashboardUtils';
import { FinancialSummary, MonthlyTrend } from '@/lib/types';
import { useAcademicYear } from '@/lib/academicYearContext';
import KPICard from './KPICard';
import TrendChart from './TrendChart';
import BOSPTable from './BOSPTable';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

export default function DashboardContent() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
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
    const loadDashboardData = async () => {
      const [sum, tr] = await Promise.all([
        getFinancialSummary(currentMonth),
        getMonthlyTrends(6)
      ]);
      setSummary(sum);
      setTrends(tr);
    };
    loadDashboardData();
  }, [currentMonth]);

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

  if (!summary) {
    return <div>Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Month Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Ringkasan keuangan sekolah bulan ini
          </p>
        </div>
        <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto min-w-[300px]">
          <button
            onClick={() => setCurrentMonth(getPrevMonth())}
            disabled={isPrevDisabled}
            className={`px-3 py-1 rounded text-sm transition ${isPrevDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            ←
          </button>
          <input
            type="month"
            value={currentMonth}
            min={minMonth}
            max={maxMonth}
            onChange={(e) => {
              if (e.target.value) setCurrentMonth(e.target.value);
            }}
            className="px-2 py-1 outline-none text-gray-800 font-semibold bg-transparent text-center cursor-pointer"
            style={{ colorScheme: 'light' }}
          />
          <button
            onClick={() => setCurrentMonth(getNextMonth())}
            disabled={isNextDisabled}
            className={`px-3 py-1 rounded text-sm transition ${isNextDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            →
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <KPICard
          title="Saldo Total"
          value={formatCurrency(summary.totalBalance)}
          icon={Wallet}
          trend={{ value: summary.monthlyIncome, label: 'pemasukan bulan ini' }}
          color="green"
        />
        <KPICard
          title="Saldo Bulan Ini"
          value={formatCurrency(summary.monthlyBalance)}
          icon={Wallet}
          trend={{ value: summary.monthlyBalance, label: 'bersih bulan ini', isPercentage: false }}
          color={summary.monthlyBalance >= 0 ? "green" : "red"}
        />
        <KPICard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(summary.monthlyIncome)}
          icon={TrendingUp}
          trend={{ value: summary.monthlyIncome - 2500000, label: 'vs bulan lalu', isPercentage: false }}
          color="green"
        />
        <KPICard
          title="Pengeluaran Bulan Ini"
          value={formatCurrency(summary.monthlyExpense)}
          icon={TrendingDown}
          trend={{ value: -(summary.monthlyExpense), label: 'pengeluaran', isPercentage: false }}
          color="red"
        />
      </div>

      {/* Warnings */}
      {summary.arrearsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-900">Tunggakan SPP</h3>
            <p className="text-sm text-amber-800 mt-1">
              {summary.arrearsCount} siswa belum melunasi SPP bulan ini. Klik menu Pendapatan untuk detail.
            </p>
          </div>
        </div>
      )}

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2">
          <TrendChart data={trends} />
        </div>

        {/* BOSP Summary Table */}
        <BOSPTable bossRemaining={summary.bossRemaining} />
      </div>
    </div>
  );
}
