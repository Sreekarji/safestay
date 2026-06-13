import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const mockData = [
  { name: 'Harassment', value: 35 }, { name: 'Theft', value: 25 }, { name: 'Unsafe Area', value: 20 },
  { name: 'Infrastructure', value: 12 }, { name: 'Health Hazard', value: 8 },
];

export function CategoryBreakdown() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader><CardTitle>{t('dashboard.categoryBreakdown')}</CardTitle><CardDescription>{t('dashboard.last30Days')}</CardDescription></CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={mockData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {mockData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
