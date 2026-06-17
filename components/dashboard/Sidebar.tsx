'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Murid',
    href: '/dashboard/students',
    icon: Users,
  },
  {
    label: 'Pendapatan',
    href: '/dashboard/income',
    icon: TrendingUp,
  },
  {
    label: 'Pengeluaran',
    href: '/dashboard/expenses',
    icon: TrendingDown,
  },
  {
    label: 'Laporan',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    label: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
    requiredRole: 'superadmin',
  },
];

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.requiredRole && user?.role !== item.requiredRole) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={`h-full w-full bg-gray-900 text-white flex flex-col overflow-hidden border-r border-gray-800 transition-all duration-300 ${
        isOpen ? 'md:w-72' : 'md:w-20'
      }`}
    >
      {/* Logo/Brand */}
      <div className={`border-b border-gray-800 ${isOpen ? 'p-6' : 'p-4'}`}>
        <div className={`flex items-center ${isOpen ? 'gap-2' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img src="/likawati.webp" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {isOpen && <span className="font-bold text-lg">TK LIKAWATI</span>}
        </div>
        {isOpen && <p className="text-xs text-gray-400 mt-2">Manajemen Keuangan Sekolah</p>}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-2 overflow-auto ${isOpen ? 'p-4' : 'p-3'}`}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : (pathname === item.href || pathname.startsWith(item.href + '/'));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center rounded-lg transition ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              } ${isOpen ? 'gap-3 px-4 py-3' : 'justify-center px-3 py-3'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`border-t border-gray-800 ${isOpen ? 'p-4' : 'p-3'}`}>
        {isOpen ? (
          <p className="text-xs text-gray-400">Versi 1.0 • {user?.schoolName}</p>
        ) : null}
      </div>
    </aside>
  );
}
