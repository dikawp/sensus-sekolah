'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SettingsContent from '@/components/settings/SettingsContent';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user?.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'superadmin') {
    return null;
  }

  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
