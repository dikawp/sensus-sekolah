'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ExpensesContent from '@/components/expenses/ExpensesContent';

export default function ExpensesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <ExpensesContent />
    </DashboardLayout>
  );
}
