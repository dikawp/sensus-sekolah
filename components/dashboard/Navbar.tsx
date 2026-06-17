'use client';

import { useAuth } from '@/lib/authContext';
import { useAcademicYear } from '@/lib/academicYearContext';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, CalendarDays } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({
  onMenuClick,
  onMobileMenuClick,
}: {
  onMenuClick: () => void;
  onMobileMenuClick?: () => void;
}) {
  const { user, logout } = useAuth();
  const { academicYears, activeAcademicYear, setActiveAcademicYear } = useAcademicYear();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between h-16">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Desktop Menu Button */}
        <button
          onClick={onMenuClick}
          className="hidden md:p-2 md:hover:bg-gray-100 md:rounded-lg md:transition"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
          {'Manajemen Keuangan'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Academic Year Selector */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <select
            value={activeAcademicYear?.id || ''}
            onChange={async (e) => {
              if (e.target.value) {
                await setActiveAcademicYear(e.target.value);
                window.location.reload(); // Reload to ensure all components fetch fresh namespaced data
              }
            }}
            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
          >
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
