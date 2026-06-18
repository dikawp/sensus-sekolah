import {
  getAllIncomeTransactions,
  getAllExpenseTransactions,
  getAllStudents,
  getBudgetByCategory,
} from './storage';
import { FinancialSummary, MonthlyTrend } from './types';
import { format, parse, addMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM');
};

export const getMonthName = (monthStr: string): string => {
  try {
    const date = parse(monthStr + '-01', 'yyyy-MM-dd', new Date());
    return format(date, 'MMMM yyyy', { locale: idLocale });
  } catch {
    return monthStr;
  }
};

export const getFinancialSummary = async (month: string = getCurrentMonth()): Promise<FinancialSummary> => {
  const [incomeTransactions, expenseTransactions, students] = await Promise.all([
    getAllIncomeTransactions(),
    getAllExpenseTransactions(),
    getAllStudents()
  ]);

  // Income in current month
  const monthlyIncome = incomeTransactions
    .filter((t) => t.month === month && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Expense in current month
  const monthlyExpense = expenseTransactions
    .filter((t) => t.month === month)
    .reduce((sum, t) => sum + t.amount, 0);

  // BOSP - Track lifetime or current year BOSP
  const bossIncome = incomeTransactions
    .filter((t) => t.category === 'Dana BOSP' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const bossDisbursed = expenseTransactions
    .filter((t) => t.fundSource === 'bosp')
    .reduce((sum, t) => sum + t.amount, 0);

  const bossRemaining = Math.max(0, bossIncome - bossDisbursed);

  // Count students without payment in current month
  const paidStudents = new Set(
    incomeTransactions
      .filter((t) => t.month === month && t.studentId)
      .map((t) => t.studentId)
  );

  const arrearsCount = students.filter((s) => !paidStudents.has(s.id)).length;

  const monthlyIncomeNonBosp = incomeTransactions
    .filter((t) => t.month === month && t.status === 'completed' && t.category !== 'Dana BOSP')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenseNonBosp = expenseTransactions
    .filter((t) => t.month === month && t.fundSource !== 'bosp')
    .reduce((sum, t) => sum + t.amount, 0);

  const operationalBalance = monthlyIncomeNonBosp - monthlyExpenseNonBosp;

  // Calculate total balance (sum of all months)
  const totalBalance =
    incomeTransactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) -
    expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    currentMonth: month,
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    bossDisbursed,
    bossRemaining,
    arrearsCount,
    monthlyBalance: monthlyIncome - monthlyExpense,
    operationalBalance,
  };
};

export const getMonthlyTrends = async (monthsBack: number = 6): Promise<MonthlyTrend[]> => {
  const trends: MonthlyTrend[] = [];
  const currentDate = new Date();
  
  const [incomeTransactions, expenseTransactions] = await Promise.all([
    getAllIncomeTransactions(),
    getAllExpenseTransactions()
  ]);

  for (let i = monthsBack - 1; i >= 0; i--) {
    const month = format(addMonths(currentDate, -i), 'yyyy-MM');

    const income = incomeTransactions
      .filter((t) => t.month === month && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = expenseTransactions
      .filter((t) => t.month === month)
      .reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      month: getMonthName(month),
      income,
      expense,
      balance: income - expense,
    });
  }

  return trends;
};

export const getMonthlyTrendsRange = async (startMonth: string, endMonth: string): Promise<MonthlyTrend[]> => {
  const trends: MonthlyTrend[] = [];
  const [incomeTransactions, expenseTransactions] = await Promise.all([
    getAllIncomeTransactions(),
    getAllExpenseTransactions()
  ]);

  let current = new Date(startMonth + '-01');
  const end = new Date(endMonth + '-01');

  // To avoid infinite loop in case of bad data, limit to 24 months
  let count = 0;
  while (current <= end && count < 24) {
    const month = format(current, 'yyyy-MM');
    const income = incomeTransactions
      .filter((t) => t.month === month && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = expenseTransactions
      .filter((t) => t.month === month)
      .reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      month: getMonthName(month),
      income,
      expense,
      balance: income - expense,
    });
    current = addMonths(current, 1);
    count++;
  }
  return trends;
};

export const getBudgetStatus = async (category: string, month: string) => {
  const budget = await getBudgetByCategory(category);
  if (!budget) return null;

  const expenseTransactions = await getAllExpenseTransactions();
  const currentExpense = expenseTransactions
    .filter((t) => t.category === category && t.month === month)
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = (currentExpense / budget.monthlyLimit) * 100;
  const isWarning = percentage >= 80;
  const isExceeded = currentExpense > budget.monthlyLimit;

  return {
    limit: budget.monthlyLimit,
    spent: currentExpense,
    percentage,
    isWarning,
    isExceeded,
    remaining: Math.max(0, budget.monthlyLimit - currentExpense),
  };
};

export const getArrearsByMonth = async (month: string) => {
  const [incomeTransactions, students] = await Promise.all([
    getAllIncomeTransactions(),
    getAllStudents()
  ]);

  const paidStudents = new Set(
    incomeTransactions
      .filter((t) => t.month === month && t.studentId)
      .map((t) => t.studentId)
  );

  return students
    .filter((s) => !paidStudents.has(s.id) && s.active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      studentId: s.studentId,
      class: s.class,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
    }));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, 'dd MMMM yyyy', { locale: idLocale });
  } catch {
    return dateStr;
  }
};
