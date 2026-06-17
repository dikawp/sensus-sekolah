'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReportsContent from '@/components/reports/ReportsContent';

export default function ReportsPage() {
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
      <ReportsContent />
    </DashboardLayout>
  );
}
