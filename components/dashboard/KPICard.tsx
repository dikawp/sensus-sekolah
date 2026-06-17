'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPercentage?: boolean;
  };
  color?: 'green' | 'green' | 'red' | 'orange';
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'green',
}: KPICardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    // green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const textColorClasses = {
    green: 'text-green-600',
    // green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <p className={`text-xs mt-2 ${textColorClasses[color]}`}>
                {trend.isPercentage !== false
                  ? `${trend.value > 0 ? '+' : ''}${trend.value.toFixed(0)}%`
                  : `Rp ${Math.abs(trend.value).toLocaleString('id-ID')}`}{' '}
                {trend.label}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
