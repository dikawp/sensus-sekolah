import { Metadata } from 'next';
import StudentsContent from '@/components/students/StudentsContent';

export const metadata: Metadata = {
  title: 'Manajemen Murid | Sensus',
  description: 'Kelola data murid dan kelas',
};

import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function StudentsPage() {
  return (
    <DashboardLayout>
      <StudentsContent />
    </DashboardLayout>
  );
}
