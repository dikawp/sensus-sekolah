// User & Auth Types
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolName: string;
  createdAt: string;
  active: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Students & Income Types
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isPerStudent?: boolean; // Only for income
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  parentName: string;
  parentPhone: string;
  registeredAt: string;
  active: boolean;
}

export interface IncomeTransaction {
  id: string;
  studentId?: string;
  category: string;
  amount: number;
  month: string; // Format: "2026-06"
  date: string;
  description?: string;
  receiptNumber?: string;
  status: 'completed' | 'pending';
}

// Expense & Budget Types
// Expenses are now strings but type remains for reference
// keeping ExpenseCategory out since we use dynamic categories

export interface ExpenseTransaction {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  month: string; // Format: "2026-06"
  vendor?: string;
  receiptFile?: string;
  fundSource?: 'pendapatan' | 'bosp';
}

export interface BudgetAllocation {
  category: string;
  monthlyLimit: number;
  yearlyLimit: number;
}

// Dashboard Types
export interface FinancialSummary {
  currentMonth: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  bossDisbursed: number;
  bossRemaining: number;
  arrearsCount: number;
  monthlyBalance: number;
  operationalBalance: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

// Payment Receipt
export interface PaymentReceipt {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentId: string;
  parentName: string;
  parentPhone: string;
  class: string;
  amount: number;
  category: string;
  month: string;
  paymentMethod: string;
  schoolName: string;
  adminName: string;
}

// Academic Year Type
export interface AcademicYear {
  id: string;
  name: string; // e.g. "2025/2026 Ganjil"
  startDate: string;
  endDate: string;
  isActive: boolean;
}
