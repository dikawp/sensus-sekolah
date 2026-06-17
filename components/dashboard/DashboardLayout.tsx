'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div
        className={`hidden md:block flex-none transition-[width] duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-16 bottom-0 w-72 max-w-[85vw] bg-gray-900 md:hidden z-50 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isOpen={true} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onMobileMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
