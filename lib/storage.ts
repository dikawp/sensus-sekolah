import {
  User,
  Student,
  IncomeTransaction,
  ExpenseTransaction,
  BudgetAllocation,
  Category,
  AcademicYear,
} from './types';
import { createClient } from './supabase/client';

const supabase = createClient();

export const getActiveYearId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_app_active_year_id');
};

export const getAllAcademicYears = async (): Promise<AcademicYear[]> => {
  const { data, error } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false });
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    name: d.name,
    startDate: d.start_date,
    endDate: d.end_date,
    isActive: d.is_active
  }));
};

export const saveAcademicYear = async (year: AcademicYear): Promise<void> => {
  const { error } = await supabase.from('academic_years').upsert({
    id: year.id,
    name: year.name,
    start_date: year.startDate,
    end_date: year.endDate,
    is_active: year.isActive
  });
  if (error) throw error;
};

export const deleteAcademicYearData = async (yearId: string): Promise<void> => {
  const { error } = await supabase.from('academic_years').delete().eq('id', yearId);
  if (error) throw error;
};

// Users
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    schoolName: data.school_name,
    createdAt: data.created_at,
    active: data.active
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    email: d.email,
    name: d.name,
    role: d.role,
    schoolName: d.school_name,
    createdAt: d.created_at,
    active: d.active
  }));
};

export const saveUser = async (user: User): Promise<void> => {
  const { error } = await supabase.from('users').upsert({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    school_name: user.schoolName,
    active: user.active
  });
  if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
};

export const getCurrentUser = (): User | null => null; // Now handled by authContext
export const setCurrentUser = (user: User | null): void => {}; // Now handled by authContext

// Students
export const getAllStudents = async (): Promise<Student[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('students').select('*').eq('academic_year_id', yearId);
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    name: d.name,
    studentId: d.student_id,
    class: d.class,
    parentName: d.parent_name,
    parentPhone: d.parent_phone,
    registeredAt: d.registered_at,
    active: d.active
  }));
};

export const getStudentById = async (studentId: string): Promise<Student | null> => {
  const { data, error } = await supabase.from('students').select('*').eq('id', studentId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    studentId: data.student_id,
    class: data.class,
    parentName: data.parent_name,
    parentPhone: data.parent_phone,
    registeredAt: data.registered_at,
    active: data.active
  };
};

export const saveStudent = async (student: Student): Promise<void> => {
  const yearId = getActiveYearId();
  if (!yearId) throw new Error('No active academic year');
  const { error } = await supabase.from('students').upsert({
    id: student.id,
    name: student.name,
    student_id: student.studentId,
    class: student.class,
    parent_name: student.parentName,
    parent_phone: student.parentPhone,
    registered_at: student.registeredAt,
    active: student.active,
    academic_year_id: yearId
  });
  if (error) throw error;
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) throw error;
};

// Income Transactions
export const getAllIncomeTransactions = async (): Promise<IncomeTransaction[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('income_transactions').select('*').eq('academic_year_id', yearId);
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    studentId: d.student_id,
    category: d.category,
    amount: Number(d.amount),
    month: d.month,
    date: d.date,
    description: d.description,
    receiptNumber: d.receipt_number,
    status: d.status
  }));
};

export const getIncomeByMonth = async (month: string): Promise<IncomeTransaction[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('income_transactions')
    .select('*')
    .eq('academic_year_id', yearId)
    .eq('month', month);
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    studentId: d.student_id,
    category: d.category,
    amount: Number(d.amount),
    month: d.month,
    date: d.date,
    description: d.description,
    receiptNumber: d.receipt_number,
    status: d.status
  }));
};

export const getStudentArrearsInMonth = async (
  studentId: string,
  month: string
): Promise<IncomeTransaction | undefined> => {
  const yearId = getActiveYearId();
  if (!yearId) return undefined;
  const { data, error } = await supabase.from('income_transactions')
    .select('*')
    .eq('academic_year_id', yearId)
    .eq('student_id', studentId)
    .eq('month', month)
    .single();
  if (error || !data) return undefined;
  return {
    id: data.id,
    studentId: data.student_id,
    category: data.category,
    amount: Number(data.amount),
    month: data.month,
    date: data.date,
    description: data.description,
    receiptNumber: data.receipt_number,
    status: data.status
  };
};

export const saveIncomeTransaction = async (transaction: IncomeTransaction): Promise<void> => {
  const yearId = getActiveYearId();
  if (!yearId) throw new Error('No active academic year');
  const { error } = await supabase.from('income_transactions').upsert({
    id: transaction.id,
    student_id: transaction.studentId || null,
    category: transaction.category,
    amount: transaction.amount,
    month: transaction.month,
    date: transaction.date,
    description: transaction.description,
    receipt_number: transaction.receiptNumber,
    status: transaction.status,
    academic_year_id: yearId
  });
  if (error) throw error;
};

export const deleteIncomeTransaction = async (transactionId: string): Promise<void> => {
  const { error } = await supabase.from('income_transactions').delete().eq('id', transactionId);
  if (error) throw error;
};

// Expense Transactions
export const getAllExpenseTransactions = async (): Promise<ExpenseTransaction[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('expense_transactions').select('*').eq('academic_year_id', yearId);
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    category: d.category,
    amount: Number(d.amount),
    date: d.date,
    description: d.description,
    month: d.month,
    vendor: d.vendor,
    receiptFile: d.receipt_file,
    fundSource: d.fund_source
  }));
};

export const getExpenseByMonth = async (month: string): Promise<ExpenseTransaction[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('expense_transactions')
    .select('*')
    .eq('academic_year_id', yearId)
    .eq('month', month);
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    category: d.category,
    amount: Number(d.amount),
    date: d.date,
    description: d.description,
    month: d.month,
    vendor: d.vendor,
    receiptFile: d.receipt_file,
    fundSource: d.fund_source
  }));
};

export const getExpenseByCategory = async (
  category: string,
  month: string
): Promise<ExpenseTransaction[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('expense_transactions')
    .select('*')
    .eq('academic_year_id', yearId)
    .eq('category', category)
    .eq('month', month);
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    category: d.category,
    amount: Number(d.amount),
    date: d.date,
    description: d.description,
    month: d.month,
    vendor: d.vendor,
    receiptFile: d.receipt_file,
    fundSource: d.fund_source
  }));
};

export const saveExpenseTransaction = async (transaction: ExpenseTransaction): Promise<void> => {
  const yearId = getActiveYearId();
  if (!yearId) throw new Error('No active academic year');
  const { error } = await supabase.from('expense_transactions').upsert({
    id: transaction.id,
    category: transaction.category,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
    month: transaction.month,
    vendor: transaction.vendor,
    receipt_file: transaction.receiptFile,
    fund_source: transaction.fundSource,
    academic_year_id: yearId
  });
  if (error) throw error;
};

export const deleteExpenseTransaction = async (transactionId: string): Promise<void> => {
  const { error } = await supabase.from('expense_transactions').delete().eq('id', transactionId);
  if (error) throw error;
};

// Budget Management
export const getAllBudgets = async (): Promise<BudgetAllocation[]> => {
  const yearId = getActiveYearId();
  if (!yearId) return [];
  const { data, error } = await supabase.from('budget_allocations').select('*').eq('academic_year_id', yearId);
  if (error || !data) return [];
  return data.map(d => ({
    category: d.category,
    monthlyLimit: Number(d.monthly_limit),
    yearlyLimit: Number(d.yearly_limit)
  }));
};

export const getBudgetByCategory = async (
  category: string
): Promise<BudgetAllocation | null> => {
  const yearId = getActiveYearId();
  if (!yearId) return null;
  const { data, error } = await supabase.from('budget_allocations')
    .select('*')
    .eq('academic_year_id', yearId)
    .eq('category', category)
    .single();
  if (error || !data) return null;
  return {
    category: data.category,
    monthlyLimit: Number(data.monthly_limit),
    yearlyLimit: Number(data.yearly_limit)
  };
};

export const saveBudget = async (budget: BudgetAllocation): Promise<void> => {
  const yearId = getActiveYearId();
  if (!yearId) throw new Error('No active academic year');
  
  const { data } = await supabase.from('budget_allocations')
    .select('id')
    .eq('academic_year_id', yearId)
    .eq('category', budget.category)
    .single();

  if (data) {
    const { error } = await supabase.from('budget_allocations').update({
      monthly_limit: budget.monthlyLimit,
      yearly_limit: budget.yearlyLimit
    }).eq('id', data.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('budget_allocations').insert({
      category: budget.category,
      monthly_limit: budget.monthlyLimit,
      yearly_limit: budget.yearlyLimit,
      academic_year_id: yearId
    });
    if (error) throw error;
  }
};

// Category Management
export const getAllCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*');
  if (error || !data) return [];
  return data.map(d => ({
    id: d.id,
    name: d.name,
    type: d.type as 'income' | 'expense',
    isPerStudent: d.is_per_student
  }));
};

export const saveCategory = async (category: Category): Promise<void> => {
  const { error } = await supabase.from('categories').upsert({
    id: category.id,
    name: category.name,
    type: category.type,
    is_per_student: category.isPerStudent
  });
  if (error) throw error;
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
};

export const initializeDefaultData = async (): Promise<void> => {
  // Not needed in Supabase since we have the real DB
};

export const clearAllData = async (): Promise<void> => {
  // Dangerous, usually won't implement this for cloud db, but keeping signature
};
