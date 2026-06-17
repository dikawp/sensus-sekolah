'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      label: 'Tambah Transaksi',
      description: 'Catat pemasukan atau pengeluaran baru',
      icon: Plus,
      href: '/dashboard/income',
      color: 'green',
    },
    {
      label: 'Buat Kuitansi',
      description: 'Generate bukti pembayaran SPP',
      icon: FileText,
      href: '/dashboard/income',
      color: 'green',
    },
    {
      label: 'Export Laporan',
      description: 'Unduh data ke format Excel',
      icon: Download,
      href: '/dashboard/reports',
      color: 'orange',
    },
  ];

  const colorClasses = {
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-start gap-3 p-3 rounded-lg transition ${
                colorClasses[action.color as keyof typeof colorClasses]
              }`}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs opacity-75 mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
