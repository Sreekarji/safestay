import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Tailwind-friendly colors: blue-600, emerald-500, amber-500, red-500, violet-500
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryBreakdownProps {
  data?: CategoryData[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.categoryBreakdown')}</CardTitle>
          <CardDescription>{t('dashboard.last30Days')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 text-center py-8">No category data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('dashboard.categoryBreakdown')}</CardTitle><CardDescription>{t('dashboard.last30Days')}</CardDescription></CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
