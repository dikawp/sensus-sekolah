'use client';

import { MonthlyTrend } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartProps {
  data: MonthlyTrend[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const formatYAxis = (value: number) => {
    return `Rp ${(value / 1000000).toFixed(0)}M`;
  };

  const formatTooltip = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Pemasukan vs Pengeluaran (6 Bulan)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={formatYAxis} />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Pemasukan" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
